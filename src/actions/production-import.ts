"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ProductionImportRowStatus } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { lookupPriceInternal } from "@/lib/pricing-server";
import { normalizeCnpj } from "@/lib/pricing";

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

async function classifyRow(
  row: ParsedRow,
  clinicScope: { clinicId?: string },
  seenKeys: Set<string>
): Promise<{
  status: ProductionImportRowStatus;
  companyId: string | null;
  priceListItemId: string | null;
  matchedPrice: number | null;
}> {
  const company = await matchCompany(clinicScope, row.companyCnpj, row.companyName);
  if (!company) {
    return { status: "SEM_EMPRESA", companyId: null, priceListItemId: null, matchedPrice: null };
  }

  const dupKey = `${company.id}:${row.patientCpf ?? row.patientName}:${row.serviceDate}:${row.examType}:${row.protocol}`;
  if (seenKeys.has(dupKey)) {
    return { status: "DUPLICADO", companyId: company.id, priceListItemId: null, matchedPrice: null };
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
    return { status: "SEM_PRECO", companyId: company.id, priceListItemId: lookup.itemId, matchedPrice: null };
  }

  if (row.importedValue != null && Math.abs(row.importedValue - lookup.price) > 0.01) {
    return {
      status: "DIVERGENCIA",
      companyId: company.id,
      priceListItemId: lookup.itemId,
      matchedPrice: lookup.price,
    };
  }

  return {
    status: "PRONTO",
    companyId: company.id,
    priceListItemId: lookup.itemId,
    matchedPrice: lookup.price,
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

    const month = new Date(input.referenceMonth);
    month.setDate(1);
    month.setHours(0, 0, 0, 0);

    const clinicScope = clinicId ? { clinicId } : {};
    const seenKeys = new Set<string>();
    const classified = await Promise.all(
      parsed.map(async (row, index) => {
        const result = await classifyRow(row, clinicScope, seenKeys);
        return { row, index, ...result };
      })
    );

    const stats = {
      totalRows: classified.length,
      recognizedRows: classified.filter((r) => r.status === "PRONTO").length,
      withoutCompany: classified.filter((r) => r.status === "SEM_EMPRESA").length,
      withoutPrice: classified.filter((r) => r.status === "SEM_PRECO").length,
      duplicates: classified.filter((r) => r.status === "DUPLICADO").length,
      divergences: classified.filter((r) => r.status === "DIVERGENCIA").length,
    };

    const importStatus =
      stats.withoutCompany > 0 || stats.withoutPrice > 0 || stats.divergences > 0
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
            create: classified.map(({ row, index, status, companyId, priceListItemId, matchedPrice }) => ({
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
            })),
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

    revalidatePath("/dashboard/fechamento-mensal");
    return { success: true, importId: productionImport.id, stats };
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

export async function generateClosingFromImport(
  importId: string,
  options?: { companyId?: string | null; createReceivable?: boolean }
): Promise<Result<{ closingId: string }>> {
  try {
    const session = await requirePermission("closings.manage");
    const clinicId = await resolveClinicId(session);
    const productionImport = await getProductionImport(importId);
    if (!productionImport) return { success: false, error: "Importação não encontrada." };

    const readyRows = productionImport.rows.filter(
      (r) =>
        (r.status === "PRONTO" || r.status === "DIVERGENCIA") &&
        (!options?.companyId || r.companyId === options.companyId)
    );

    if (readyRows.length === 0) {
      return { success: false, error: "Nenhum registro pronto para fechamento." };
    }

    const totalAmount = readyRows.reduce((sum, r) => sum + (r.matchedPrice ?? r.importedValue ?? 0), 0);
    const companyId = options?.companyId ?? readyRows[0]?.companyId ?? null;

    const closing = await prisma.monthlyClosing.create({
      data: withClinicId(
        {
          referenceMonth: productionImport.referenceMonth,
          companyId,
          importId: productionImport.id,
          status: "EM_CONFERENCIA",
          totalAmount,
          importedCount: readyRows.length,
          withoutPriceCount: productionImport.withoutPrice,
          divergenceCount: productionImport.divergences,
          createdByUserId: session.user.id,
          lineItems: {
            create: readyRows.map((r) => ({
              companyId: r.companyId,
              serviceName: r.examType ?? "Atendimento ocupacional",
              patientName: r.patientName,
              patientCpf: r.patientCpf,
              serviceDate: r.serviceDate,
              examType: r.examType,
              unitPrice: r.matchedPrice ?? r.importedValue ?? 0,
              totalPrice: r.matchedPrice ?? r.importedValue ?? 0,
            })),
          },
        },
        clinicId
      ),
    });

    await prisma.productionImportRow.updateMany({
      where: { id: { in: readyRows.map((r) => r.id) } },
      data: { closingId: closing.id },
    });

    if (options?.createReceivable && companyId && totalAmount > 0) {
      const due = new Date(productionImport.referenceMonth);
      due.setMonth(due.getMonth() + 1);
      due.setDate(10);
      await prisma.financialEntry.create({
        data: withClinicId(
          {
            type: "RECEBER",
            source: "FECHAMENTO",
            description: `Fechamento ${due.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
            amount: totalAmount,
            dueDate: due,
            companyId,
            closingId: closing.id,
            referenceMonth: productionImport.referenceMonth,
            status: "AGUARDANDO_FATURAMENTO",
          },
          clinicId
        ),
      });
    }

    revalidatePath("/dashboard/fechamento-mensal");
    revalidatePath("/dashboard/financeiro");
    return { success: true, closingId: closing.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao gerar fechamento.") };
  }
}
