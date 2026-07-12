"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ProductionImportRowStatus } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { competenceToDate, resolveClosingWorkflowStatus } from "@/lib/closings";
import { normalizeCnpj } from "@/lib/pricing";
import { lookupPriceInternal } from "@/lib/pricing-server";

type Result<T extends Record<string, unknown> = Record<string, never>> =
  | ({ success: true } & T)
  | { success: false; error: string };

type ParsedRow = {
  companyName?: string;
  companyCnpj?: string;
  patientName?: string;
  patientCpf?: string;
  serviceDate?: string;
  examType?: string;
  complementaryExams?: string;
  protocol?: string;
  importedValue?: number;
};

function pickField(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function parseDelimitedLine(line: string, delimiter: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

function parseProductionCsv(csvText: string): ParsedRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = parseDelimitedLine(lines[0], delimiter).map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_")
  );

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseDelimitedLine(lines[i], delimiter);
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = cells[idx] ?? "";
    });

    const importedValueRaw = pickField(record, ["valor", "preco", "price", "total"]);
    rows.push({
      companyName: pickField(record, ["empresa", "razao_social", "nome_empresa", "company"]),
      companyCnpj: pickField(record, ["cnpj", "documento_empresa"]),
      patientName: pickField(record, ["colaborador", "paciente", "nome", "funcionario"]),
      patientCpf: pickField(record, ["cpf", "documento"]),
      serviceDate: pickField(record, ["data", "data_atendimento", "data_exame", "service_date"]),
      examType: pickField(record, ["tipo_exame", "exame", "tipo", "exam_type"]),
      complementaryExams: pickField(record, ["exames_complementares", "complementares"]),
      protocol: pickField(record, ["protocolo", "protocol", "numero_protocolo"]),
      importedValue: importedValueRaw ? parseFloat(importedValueRaw.replace(",", ".")) : undefined,
    });
  }
  return rows.filter(
    (r) => r.companyName || r.patientName || r.examType || r.protocol
  );
}

async function matchCompany(clinicScope: { clinicId?: string }, cnpj?: string, name?: string) {
  if (cnpj) {
    const digits = normalizeCnpj(cnpj);
    const byCnpj = await prisma.company.findFirst({
      where: {
        ...(clinicScope.clinicId ? { clinicId: clinicScope.clinicId } : {}),
        cnpj: { contains: digits.slice(0, 8) },
      },
    });
    if (byCnpj) return byCnpj;
  }
  if (name) {
    return prisma.company.findFirst({
      where: {
        ...(clinicScope.clinicId ? { clinicId: clinicScope.clinicId } : {}),
        OR: [
          { legalName: { contains: name, mode: "insensitive" } },
          { tradeName: { contains: name, mode: "insensitive" } },
        ],
      },
    });
  }
  return null;
}

async function companyHasPackage(companyId: string, clinicId?: string | null) {
  const count = await prisma.priceListItem.count({
    where: {
      companyId,
      status: "ATIVA",
      ...(clinicId ? { clinicId } : {}),
    },
  });
  return count > 0;
}

async function classifyRow(
  row: ParsedRow,
  clinicScope: { clinicId?: string },
  seenKeys: Set<string>,
  packageCache: Map<string, boolean>
): Promise<{
  status: ProductionImportRowStatus;
  companyId: string | null;
  priceListItemId: string | null;
  matchedPrice: number | null;
  situation: string;
}> {
  const company = await matchCompany(clinicScope, row.companyCnpj, row.companyName);
  if (!company) {
    return {
      status: "SEM_EMPRESA",
      companyId: null,
      priceListItemId: null,
      matchedPrice: null,
      situation: "SEM_EMPRESA",
    };
  }

  const dupKey = `${company.id}:${row.patientCpf ?? row.patientName}:${row.serviceDate}:${row.examType}:${row.protocol}`;
  if (seenKeys.has(dupKey)) {
    return {
      status: "DUPLICADO",
      companyId: company.id,
      priceListItemId: null,
      matchedPrice: null,
      situation: "DUPLICADO",
    };
  }
  seenKeys.add(dupKey);

  const serviceName = row.examType ?? "Atendimento ocupacional";
  const lookup = await lookupPriceInternal({
    serviceName,
    companyId: company.id,
    examType: row.examType,
    clinicId: clinicScope.clinicId,
  });

  if (lookup.price == null) {
    return {
      status: "SEM_PRECO",
      companyId: company.id,
      priceListItemId: lookup.itemId,
      matchedPrice: null,
      situation: "SEM_PRECO",
    };
  }

  if (row.importedValue != null && Math.abs(row.importedValue - lookup.price) > 0.01) {
    return {
      status: "DIVERGENCIA",
      companyId: company.id,
      priceListItemId: lookup.itemId,
      matchedPrice: lookup.price,
      situation: "DIVERGENCIA",
    };
  }

  let hasPackage = packageCache.get(company.id);
  if (hasPackage === undefined) {
    hasPackage = await companyHasPackage(company.id, clinicScope.clinicId);
    packageCache.set(company.id, hasPackage);
  }
  if (hasPackage && lookup.source === "default") {
    return {
      status: "PRONTO",
      companyId: company.id,
      priceListItemId: lookup.itemId,
      matchedPrice: lookup.price,
      situation: "FORA_PACOTE",
    };
  }

  return {
    status: "PRONTO",
    companyId: company.id,
    priceListItemId: lookup.itemId,
    matchedPrice: lookup.price,
    situation: "OK",
  };
}

export async function importProductionCsv(input: {
  referenceMonth: string;
  fileName?: string;
  csvText: string;
}): Promise<Result<{ importId: string; stats: Record<string, number> }>> {
  try {
    const session = await requirePermission("closings.manage");
    const clinicId = await resolveClinicId(session);
    const parsed = parseProductionCsv(input.csvText);
    if (parsed.length === 0) {
      return { success: false, error: "Planilha vazia ou formato não reconhecido." };
    }

    const month = competenceToDate(input.referenceMonth);

    const clinicScope = clinicId ? { clinicId } : {};
    const seenKeys = new Set<string>();
    const packageCache = new Map<string, boolean>();
    const classified: Array<{
      row: ParsedRow;
      index: number;
      status: ProductionImportRowStatus;
      companyId: string | null;
      priceListItemId: string | null;
      matchedPrice: number | null;
      situation: string;
    }> = [];

    // Sequencial para dedupe e cache de pacote consistentes
    for (let index = 0; index < parsed.length; index++) {
      const result = await classifyRow(parsed[index], clinicScope, seenKeys, packageCache);
      classified.push({ row: parsed[index], index, ...result });
    }

    const stats = {
      totalRows: classified.length,
      recognizedRows: classified.filter((r) => r.status === "PRONTO").length,
      withoutCompany: classified.filter((r) => r.status === "SEM_EMPRESA").length,
      withoutPrice: classified.filter((r) => r.status === "SEM_PRECO").length,
      duplicates: classified.filter((r) => r.status === "DUPLICADO").length,
      divergences: classified.filter((r) => r.status === "DIVERGENCIA").length,
    };

    const importStatus =
      stats.withoutCompany > 0 ||
      stats.withoutPrice > 0 ||
      stats.divergences > 0 ||
      stats.duplicates > 0
        ? "COM_DIVERGENCIA"
        : "EM_CONFERENCIA";

    const productionImport = await prisma.productionImport.create({
      data: withClinicId(
        {
          referenceMonth: month,
          fileName: input.fileName?.trim() || null,
          status: importStatus,
          totalRows: stats.totalRows,
          recognizedRows: stats.recognizedRows,
          withoutCompany: stats.withoutCompany,
          withoutPrice: stats.withoutPrice,
          duplicates: stats.duplicates,
          divergences: stats.divergences,
          importedByUserId: session.user.id,
          rows: {
            create: classified.map(
              ({ row, index, status, companyId, priceListItemId, matchedPrice, situation }) => ({
                rowNumber: index + 1,
                companyName: row.companyName ?? null,
                companyCnpj: row.companyCnpj ?? null,
                patientName: row.patientName ?? null,
                patientCpf: row.patientCpf ?? null,
                serviceDate: row.serviceDate ? new Date(row.serviceDate) : null,
                examType: row.examType ?? null,
                complementaryExams: row.complementaryExams ?? null,
                protocol: row.protocol ?? null,
                importedValue: row.importedValue ?? null,
                matchedPrice,
                status,
                companyId,
                priceListItemId,
                notes: `SIT:${situation}`,
              })
            ),
          },
        },
        clinicId
      ),
      include: { rows: true },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "ProductionImport",
      entityId: productionImport.id,
      details: `${stats.totalRows} registros importados`,
    });

    // Gera um fechamento por empresa (sem criar cobrança no Financeiro)
    const generated = await generateClosingsFromImport(productionImport.id);

    revalidatePath("/dashboard/fechamento-mensal");
    return {
      success: true,
      importId: productionImport.id,
      stats: {
        ...stats,
        closingsCreated: generated.success ? generated.created : 0,
      },
    };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao importar produção.") };
  }
}

export async function getProductionImport(id: string) {
  const session = await requirePermission("closings.manage");
  const where = scopedWhere(session, { id });
  return prisma.productionImport.findFirst({
    where,
    include: {
      rows: { orderBy: { rowNumber: "asc" }, include: { company: { select: { tradeName: true, legalName: true } } } },
      closings: true,
    },
  });
}

export async function listProductionImports() {
  const session = await requirePermission("closings.manage");
  const scope = scopedWhere(session, {});
  return prisma.productionImport.findMany({
    where: scope,
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function generateClosingsFromImport(
  importId: string
): Promise<Result<{ created: number; closingIds: string[] }>> {
  try {
    const session = await requirePermission("closings.manage");
    const clinicId = await resolveClinicId(session);
    const productionImport = await getProductionImport(importId);
    if (!productionImport) return { success: false, error: "Importação não encontrada." };

    const byCompany = new Map<string, typeof productionImport.rows>();
    for (const row of productionImport.rows) {
      if (!row.companyId) continue;
      const list = byCompany.get(row.companyId) ?? [];
      list.push(row);
      byCompany.set(row.companyId, list);
    }

    if (byCompany.size === 0) {
      return { success: false, error: "Nenhum registro com empresa identificada." };
    }

    const closingIds: string[] = [];

    for (const [companyId, rows] of byCompany) {
      const withoutPrice = rows.filter((r) => r.status === "SEM_PRECO").length;
      const divergences = rows.filter(
        (r) => r.status === "DIVERGENCIA" || r.status === "DUPLICADO"
      ).length;
      const duplicates = rows.filter((r) => r.status === "DUPLICADO").length;
      const status = resolveClosingWorkflowStatus({
        withoutPriceCount: withoutPrice,
        divergenceCount: divergences,
        duplicateCount: duplicates,
      });

      const pricedTotal = rows.reduce((sum, r) => {
        if (r.status === "SEM_PRECO" || r.status === "DUPLICADO") return sum;
        return sum + (r.matchedPrice ?? 0);
      }, 0);

      const closing = await prisma.monthlyClosing.create({
        data: withClinicId(
          {
            referenceMonth: productionImport.referenceMonth,
            companyId,
            importId: productionImport.id,
            status,
            totalAmount: pricedTotal,
            importedCount: rows.length,
            withoutPriceCount: withoutPrice,
            divergenceCount: divergences + duplicates,
            createdByUserId: session.user.id,
            lineItems: {
              create: rows.map((r) => {
                const situation =
                  r.notes?.startsWith("SIT:")
                    ? r.notes.slice(4)
                    : r.status === "SEM_PRECO"
                      ? "SEM_PRECO"
                      : r.status === "DUPLICADO"
                        ? "DUPLICADO"
                        : r.status === "DIVERGENCIA"
                          ? "DIVERGENCIA"
                          : "OK";
                const unit =
                  situation === "SEM_PRECO" || situation === "DUPLICADO"
                    ? 0
                    : (r.matchedPrice ?? 0);
                return {
                  companyId: r.companyId,
                  serviceName: r.examType ?? "Atendimento ocupacional",
                  patientName: r.patientName,
                  patientCpf: r.patientCpf,
                  serviceDate: r.serviceDate,
                  examType: r.examType,
                  quantity: 1,
                  unitPrice: unit,
                  totalPrice: unit,
                  notes: `SIT:${situation}`,
                };
              }),
            },
          },
          clinicId
        ),
      });

      await prisma.productionImportRow.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { closingId: closing.id },
      });

      closingIds.push(closing.id);
    }

    await prisma.productionImport.update({
      where: { id: productionImport.id },
      data: { status: "CONFERIDO" },
    });

    revalidatePath("/dashboard/fechamento-mensal");
    return { success: true, created: closingIds.length, closingIds };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao gerar fechamentos.") };
  }
}

/** @deprecated Use generateClosingsFromImport — mantido para compatibilidade. */
export async function generateClosingFromImport(
  importId: string,
  _options?: { companyId?: string | null; createReceivable?: boolean }
): Promise<Result<{ closingId: string }>> {
  const result = await generateClosingsFromImport(importId);
  if (!result.success) return result;
  return { success: true, closingId: result.closingIds[0] ?? "" };
}

