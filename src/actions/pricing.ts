"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PriceChargeType, PriceItemCategory, PriceListStatus } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { effectivePrice, PRICE_CATEGORY_LABELS } from "@/lib/pricing";
import { lookupPriceInternal } from "@/lib/pricing-server";

type Result<T extends Record<string, unknown> = {}> =
  | ({ success: true } & T)
  | { success: false; error: string };

export type PriceListItemInput = {
  name: string;
  code?: string;
  category?: PriceItemCategory;
  examId?: string | null;
  defaultPrice: number;
  companyId?: string | null;
  negotiatedPrice?: number | null;
  chargeType?: PriceChargeType;
  validFrom?: string | null;
  validUntil?: string | null;
  status?: PriceListStatus;
  notes?: string;
};

export async function listPriceItems(filters?: {
  companyId?: string | null;
  category?: PriceItemCategory;
  q?: string;
  status?: PriceListStatus;
}) {
  const session = await requirePermission("pricing.manage");
  const scope = scopedWhere(session, {});

  const companyFilter =
    filters?.companyId === "default"
      ? { companyId: null }
      : filters?.companyId
        ? { companyId: filters.companyId }
        : {};

  return prisma.priceListItem.findMany({
    where: {
      ...scope,
      ...companyFilter,
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.q?.trim()
        ? {
            OR: [
              { name: { contains: filters.q.trim(), mode: "insensitive" } },
              { code: { contains: filters.q.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      company: { select: { id: true, tradeName: true, legalName: true } },
      exam: { select: { id: true, name: true } },
    },
    orderBy: [{ companyId: "asc" }, { name: "asc" }],
  });
}

export async function getPriceStats() {
  const session = await requirePermission("pricing.manage");
  const scope = scopedWhere(session, {});

  const [total, active, companySpecific, withoutDefault] = await Promise.all([
    prisma.priceListItem.count({ where: scope }),
    prisma.priceListItem.count({ where: { ...scope, status: "ATIVA" } }),
    prisma.priceListItem.count({ where: { ...scope, companyId: { not: null } } }),
    prisma.priceListItem.count({ where: { ...scope, companyId: null, defaultPrice: 0 } }),
  ]);

  return { total, active, companySpecific, withoutDefault };
}

export async function createPriceItem(input: PriceListItemInput): Promise<Result<{ id: string }>> {
  try {
    const session = await requirePermission("pricing.manage");
    const clinicId = await resolveClinicId(session);
    if (!input.name?.trim()) return { success: false, error: "Nome do serviço é obrigatório." };
    if (input.defaultPrice < 0) return { success: false, error: "Preço inválido." };

    const item = await prisma.priceListItem.create({
      data: withClinicId(
        {
          name: input.name.trim(),
          code: input.code?.trim() || null,
          category: input.category ?? "EXAME",
          examId: input.examId || null,
          defaultPrice: input.defaultPrice,
          companyId: input.companyId || null,
          negotiatedPrice: input.companyId ? input.negotiatedPrice ?? null : null,
          chargeType: input.chargeType ?? "AVULSA",
          validFrom: input.validFrom ? new Date(input.validFrom) : null,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          status: input.status ?? "ATIVA",
          notes: input.notes?.trim() || null,
        },
        clinicId
      ),
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "PriceListItem",
      entityId: item.id,
      details: item.name,
    });

    revalidatePath("/dashboard/tabela-precos");
    return { success: true, id: item.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao criar preço.") };
  }
}

export async function updatePriceItem(id: string, input: PriceListItemInput): Promise<Result> {
  try {
    const session = await requirePermission("pricing.manage");
    const where = scopedWhere(session, { id });
    const existing = await prisma.priceListItem.findFirst({ where });
    if (!existing) return { success: false, error: "Item não encontrado." };

    const newPrice = input.companyId ? (input.negotiatedPrice ?? input.defaultPrice) : input.defaultPrice;
    const oldPrice = effectivePrice(existing);

    await prisma.priceListItem.updateMany({
      where,
      data: {
        name: input.name.trim(),
        code: input.code?.trim() || null,
        category: input.category ?? existing.category,
        examId: input.examId || null,
        defaultPrice: input.defaultPrice,
        companyId: input.companyId || null,
        negotiatedPrice: input.companyId ? input.negotiatedPrice ?? null : null,
        chargeType: input.chargeType ?? existing.chargeType,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        status: input.status ?? existing.status,
        notes: input.notes?.trim() || null,
      },
    });

    if (oldPrice !== newPrice) {
      await prisma.priceListHistory.create({
        data: {
          priceListItemId: id,
          oldPrice,
          newPrice,
          changedByUserId: session.user.id,
        },
      });
    }

    revalidatePath("/dashboard/tabela-precos");
    return { success: true };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar preço.") };
  }
}

export async function deletePriceItem(id: string): Promise<Result> {
  try {
    const session = await requirePermission("pricing.manage");
    const where = scopedWhere(session, { id });
    await prisma.priceListItem.deleteMany({ where });
    revalidatePath("/dashboard/tabela-precos");
    return { success: true };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao excluir preço.") };
  }
}

export async function lookupPrice(input: {
  serviceName: string;
  companyId?: string | null;
  examType?: string | null;
}) {
  const session = await requirePermission("pricing.manage");
  const clinicId = session.user.clinicId ?? undefined;
  return lookupPriceInternal({ ...input, clinicId: clinicId ?? undefined });
}

export async function listPricesForQuote(companyId?: string | null) {
  const session = await requirePermission("leads.manage");
  const scope = scopedWhere(session, { status: "ATIVA" });

  const [defaults, companyItems] = await Promise.all([
    prisma.priceListItem.findMany({
      where: { ...scope, companyId: null },
      orderBy: { name: "asc" },
      take: 200,
    }),
    companyId
      ? prisma.priceListItem.findMany({
          where: { ...scope, companyId },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const merged = new Map<string, { name: string; price: number; category: string | null }>();
  for (const item of defaults) {
    merged.set(item.name.toLowerCase(), {
      name: item.name,
      price: item.defaultPrice,
      category: item.category,
    });
  }
  for (const item of companyItems) {
    merged.set(item.name.toLowerCase(), {
      name: item.name,
      price: effectivePrice(item),
      category: item.category,
    });
  }

  return Array.from(merged.values());
}

export type PriceCatalogRow = {
  key: string;
  priceId: string | null;
  examId: string | null;
  name: string;
  itemType: "EXAME" | "SERVICO";
  category: PriceItemCategory;
  categoryLabel: string;
  defaultPrice: number | null;
  status: PriceListStatus;
  updatedAt: string;
  notes: string | null;
  code: string | null;
  chargeType: string;
  validFrom: string | null;
  validUntil: string | null;
};

function mapExamCategoryToPrice(category: string): PriceItemCategory {
  if (category === "CLINICO_OCUPACIONAL") return "ASO";
  return "EXAME";
}

function mapExamStatusToPrice(status: string): PriceListStatus {
  return status === "INATIVO" ? "INATIVA" : "ATIVA";
}

/** Catálogo de preços padrão: exames do sistema + serviços avulsos (sem preços por empresa). */
export async function listPriceCatalog(): Promise<{
  defaults: PriceCatalogRow[];
}> {
  const session = await requirePermission("pricing.manage");
  const scope = scopedWhere(session, {});

  const [exams, priceItems] = await Promise.all([
    prisma.exam.findMany({
      where: scope,
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.priceListItem.findMany({
      where: { ...scope, companyId: null },
      orderBy: [{ name: "asc" }],
    }),
  ]);

  const defaultByExamId = new Map<string, (typeof priceItems)[number]>();
  const defaultByName = new Map<string, (typeof priceItems)[number]>();
  const defaultsStandalone: (typeof priceItems)[number][] = [];

  for (const item of priceItems) {
    if (item.examId) {
      defaultByExamId.set(item.examId, item);
    } else {
      defaultsStandalone.push(item);
    }
    defaultByName.set(item.name.trim().toLowerCase(), item);
  }

  const linkedPriceIds = new Set<string>();
  const defaults: PriceCatalogRow[] = [];

  for (const exam of exams) {
    const linked =
      defaultByExamId.get(exam.id) ??
      defaultByName.get(exam.name.trim().toLowerCase()) ??
      null;
    if (linked) linkedPriceIds.add(linked.id);

    defaults.push({
      key: linked ? `price:${linked.id}` : `exam:${exam.id}`,
      priceId: linked?.id ?? null,
      examId: exam.id,
      name: exam.name,
      itemType: "EXAME",
      category: linked?.category ?? mapExamCategoryToPrice(exam.category),
      categoryLabel: PRICE_CATEGORY_LABELS[linked?.category ?? mapExamCategoryToPrice(exam.category)],
      defaultPrice: linked ? (linked.defaultPrice > 0 ? linked.defaultPrice : null) : null,
      status: linked?.status ?? mapExamStatusToPrice(exam.status),
      updatedAt: (linked?.updatedAt ?? exam.updatedAt).toISOString(),
      notes: linked?.notes ?? null,
      code: linked?.code ?? null,
      chargeType: linked?.chargeType ?? "AVULSA",
      validFrom: linked?.validFrom?.toISOString() ?? null,
      validUntil: linked?.validUntil?.toISOString() ?? null,
    });
  }

  for (const item of defaultsStandalone) {
    if (linkedPriceIds.has(item.id)) continue;
    const matchedExam = exams.find(
      (e) => e.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );
    if (matchedExam) continue;

    defaults.push({
      key: `price:${item.id}`,
      priceId: item.id,
      examId: null,
      name: item.name,
      itemType: item.category === "EXAME" || item.category === "ASO" ? "EXAME" : "SERVICO",
      category: item.category,
      categoryLabel: PRICE_CATEGORY_LABELS[item.category],
      defaultPrice: item.defaultPrice > 0 ? item.defaultPrice : null,
      status: item.status,
      updatedAt: item.updatedAt.toISOString(),
      notes: item.notes,
      code: item.code,
      chargeType: item.chargeType,
      validFrom: item.validFrom?.toISOString() ?? null,
      validUntil: item.validUntil?.toISOString() ?? null,
    });
  }

  defaults.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return { defaults };
}

/** Upsert apenas de preços padrão (companyId sempre null). Pacotes de empresa usam saveCompanyExamPackage. */
export async function upsertCatalogPrice(input: {
  priceId?: string | null;
  examId?: string | null;
  name: string;
  category?: PriceItemCategory;
  defaultPrice: number | null;
  status?: PriceListStatus;
  notes?: string;
  validFrom?: string | null;
  validUntil?: string | null;
  chargeType?: PriceChargeType;
}): Promise<Result<{ id: string }>> {
  try {
    const session = await requirePermission("pricing.manage");
    const clinicId = await resolveClinicId(session);
    if (!input.name?.trim()) return { success: false, error: "Nome obrigatório." };

    const priceValue = input.defaultPrice != null && input.defaultPrice > 0 ? input.defaultPrice : 0;

    if (input.priceId) {
      const where = scopedWhere(session, { id: input.priceId, companyId: null });
      const existing = await prisma.priceListItem.findFirst({ where });
      if (!existing) return { success: false, error: "Item não encontrado." };

      const oldPrice = existing.defaultPrice;

      await prisma.priceListItem.updateMany({
        where,
        data: {
          name: input.name.trim(),
          category: input.category ?? existing.category,
          examId: input.examId ?? existing.examId,
          defaultPrice: priceValue,
          companyId: null,
          negotiatedPrice: null,
          chargeType: input.chargeType ?? existing.chargeType,
          validFrom: input.validFrom ? new Date(input.validFrom) : null,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          status: input.status ?? existing.status,
          notes: input.notes?.trim() || null,
        },
      });

      if (oldPrice !== priceValue) {
        await prisma.priceListHistory.create({
          data: {
            priceListItemId: input.priceId,
            oldPrice,
            newPrice: priceValue,
            changedByUserId: session.user.id,
          },
        });
      }

      revalidatePath("/dashboard/tabela-precos");
      return { success: true, id: input.priceId };
    }

    const item = await prisma.priceListItem.create({
      data: withClinicId(
        {
          name: input.name.trim(),
          category: input.category ?? "EXAME",
          examId: input.examId || null,
          defaultPrice: priceValue,
          companyId: null,
          negotiatedPrice: null,
          chargeType: input.chargeType ?? "AVULSA",
          validFrom: input.validFrom ? new Date(input.validFrom) : null,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          status: input.status ?? "ATIVA",
          notes: input.notes?.trim() || null,
        },
        clinicId
      ),
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "PriceListItem",
      entityId: item.id,
      details: item.name,
    });

    revalidatePath("/dashboard/tabela-precos");
    return { success: true, id: item.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao salvar preço.") };
  }
}

export async function batchUpdateCatalogPrices(input: {
  items: {
    priceId?: string | null;
    examId?: string | null;
    name: string;
    category?: PriceItemCategory;
    defaultPrice: number;
  }[];
}): Promise<Result<{ updated: number }>> {
  try {
    await requirePermission("pricing.manage");
    if (!input.items.length) return { success: false, error: "Selecione ao menos um item." };
    if (input.items.some((i) => i.defaultPrice < 0)) {
      return { success: false, error: "Preço inválido." };
    }

    let updated = 0;
    for (const item of input.items) {
      const result = await upsertCatalogPrice({
        priceId: item.priceId,
        examId: item.examId,
        name: item.name,
        category: item.category,
        defaultPrice: item.defaultPrice,
      });
      if (result.success) updated += 1;
    }

    revalidatePath("/dashboard/tabela-precos");
    return { success: true, updated };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar preços em lote.") };
  }
}

export async function toggleCatalogPriceStatus(input: {
  priceId?: string | null;
  examId?: string | null;
  name: string;
  category?: PriceItemCategory;
  currentStatus: PriceListStatus;
  defaultPrice?: number | null;
}): Promise<Result<{ id: string }>> {
  const nextStatus: PriceListStatus = input.currentStatus === "ATIVA" ? "INATIVA" : "ATIVA";

  if (input.priceId) {
    try {
      const session = await requirePermission("pricing.manage");
      const where = scopedWhere(session, { id: input.priceId, companyId: null });
      await prisma.priceListItem.updateMany({
        where,
        data: { status: nextStatus },
      });
      const updated = await prisma.priceListItem.findFirst({ where, select: { id: true } });
      if (!updated) return { success: false, error: "Item não encontrado." };
      revalidatePath("/dashboard/tabela-precos");
      return { success: true, id: updated.id };
    } catch (e) {
      return { success: false, error: actionError(e, "Erro ao alterar status.") };
    }
  }

  return upsertCatalogPrice({
    priceId: null,
    examId: input.examId,
    name: input.name,
    category: input.category,
    defaultPrice: input.defaultPrice ?? null,
    status: nextStatus,
  });
}

export async function importCatalogPricesFromRows(
  rows: { name: string; price: number; category?: string }[]
): Promise<Result<{ updated: number; skipped: number }>> {
  try {
    await requirePermission("pricing.manage");
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const name = row.name?.trim();
      if (!name || !(row.price > 0)) {
        skipped += 1;
        continue;
      }
      const category =
        row.category && row.category in PRICE_CATEGORY_LABELS
          ? (row.category as PriceItemCategory)
          : undefined;

      const existing = await prisma.priceListItem.findFirst({
        where: {
          companyId: null,
          name: { equals: name, mode: "insensitive" },
        },
      });

      const exam = await prisma.exam.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true },
      });

      const result = await upsertCatalogPrice({
        priceId: existing?.id,
        examId: exam?.id ?? existing?.examId,
        name,
        category: category ?? existing?.category ?? (exam ? "EXAME" : "SERVICO"),
        defaultPrice: row.price,
      });
      if (result.success) updated += 1;
      else skipped += 1;
    }

    revalidatePath("/dashboard/tabela-precos");
    return { success: true, updated, skipped };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao importar planilha.") };
  }
}

export type CompanyPackageCatalogItem = {
  examId: string;
  name: string;
  category: PriceItemCategory;
  categoryLabel: string;
  examCategoryLabel: string;
  defaultPrice: number | null;
  inPackage: boolean;
  packageItemId: string | null;
  negotiatedPrice: number | null;
};

export async function listCompanyPackageCatalog(
  companyId: string
): Promise<CompanyPackageCatalogItem[]> {
  const session = await requirePermission("pricing.manage");
  const scope = scopedWhere(session, {});

  const company = await prisma.company.findFirst({
    where: scopedWhere(session, { id: companyId }),
    select: { id: true },
  });
  if (!company) return [];

  const [exams, defaults, packageItems] = await Promise.all([
    prisma.exam.findMany({
      where: { ...scope, status: "ATIVO" },
      select: { id: true, name: true, category: true, internalTags: true },
      orderBy: { name: "asc" },
    }),
    prisma.priceListItem.findMany({
      where: { ...scope, companyId: null },
      select: { id: true, examId: true, name: true, defaultPrice: true, category: true },
    }),
    prisma.priceListItem.findMany({
      where: { companyId },
      select: {
        id: true,
        examId: true,
        name: true,
        negotiatedPrice: true,
      },
    }),
  ]);

  const { EXAM_CATEGORY_LABELS } = await import("@/lib/exams");

  const defaultByExam = new Map(
    defaults.filter((d) => d.examId).map((d) => [d.examId!, d])
  );
  const defaultByName = new Map(
    defaults.map((d) => [d.name.trim().toLowerCase(), d])
  );
  const pkgByExam = new Map(
    packageItems.filter((p) => p.examId).map((p) => [p.examId!, p])
  );
  const pkgByName = new Map(
    packageItems.map((p) => [p.name.trim().toLowerCase(), p])
  );

  return exams.map((exam) => {
    const def =
      defaultByExam.get(exam.id) ?? defaultByName.get(exam.name.trim().toLowerCase()) ?? null;
    const pkg =
      pkgByExam.get(exam.id) ?? pkgByName.get(exam.name.trim().toLowerCase()) ?? null;
    const category = def?.category ?? mapExamCategoryToPrice(exam.category);
    const grupoTag = exam.internalTags
      ?.split("|")
      .find((p) => p.startsWith("grupo:"))
      ?.slice(6);
    return {
      examId: exam.id,
      name: exam.name,
      category,
      categoryLabel: PRICE_CATEGORY_LABELS[category] ?? category,
      examCategoryLabel: grupoTag || EXAM_CATEGORY_LABELS[exam.category] || exam.category,
      defaultPrice: def && def.defaultPrice > 0 ? def.defaultPrice : null,
      inPackage: !!pkg,
      packageItemId: pkg?.id ?? null,
      negotiatedPrice:
        pkg?.negotiatedPrice != null && pkg.negotiatedPrice > 0 ? pkg.negotiatedPrice : null,
    };
  });
}

export async function saveCompanyExamPackage(input: {
  companyId: string;
  validFrom?: string | null;
  validUntil?: string | null;
  items: {
    examId: string;
    name: string;
    category?: PriceItemCategory;
    defaultPrice: number | null;
    negotiatedPrice: number | null;
    useDefault?: boolean;
  }[];
}): Promise<Result<{ saved: number }>> {
  try {
    const session = await requirePermission("pricing.manage");
    const clinicId = await resolveClinicId(session);
    const company = await prisma.company.findFirst({
      where: scopedWhere(session, { id: input.companyId }),
      select: { id: true },
    });
    if (!company) return { success: false, error: "Empresa não encontrada." };

    // Deduplicate by examId
    const uniqueItems = new Map<string, (typeof input.items)[number]>();
    for (const item of input.items) {
      if (!item.examId) continue;
      uniqueItems.set(item.examId, item);
    }

    const existing = await prisma.priceListItem.findMany({
      where: { companyId: input.companyId },
      select: { id: true, examId: true, name: true },
    });
    const byExam = new Map(existing.filter((e) => e.examId).map((e) => [e.examId!, e]));
    const byName = new Map(existing.map((e) => [e.name.trim().toLowerCase(), e]));

    const keepIds = new Set<string>();
    let saved = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of uniqueItems.values()) {
        const negotiated =
          item.useDefault && item.defaultPrice != null && item.defaultPrice > 0
            ? item.defaultPrice
            : item.negotiatedPrice != null && item.negotiatedPrice > 0
              ? item.negotiatedPrice
              : item.defaultPrice != null && item.defaultPrice > 0
                ? item.defaultPrice
                : null;

        if (negotiated == null) {
          throw new Error(
            `Informe o preço negociado de "${item.name}" ou use o preço padrão.`
          );
        }

        const found =
          byExam.get(item.examId) ?? byName.get(item.name.trim().toLowerCase()) ?? null;

        const snapshotDefault =
          item.defaultPrice != null && item.defaultPrice > 0 ? item.defaultPrice : 0;

        const payload = {
          examId: item.examId,
          name: item.name.trim(),
          category: item.category ?? "EXAME",
          // Snapshot local — nunca altera PriceListItem com companyId null
          defaultPrice: snapshotDefault,
          negotiatedPrice: negotiated,
          chargeType: "AVULSA" as const,
          validFrom: input.validFrom ? new Date(input.validFrom) : null,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          status: "ATIVA" as const,
          notes: "Pacote contratado da empresa",
        };

        if (found) {
          await tx.priceListItem.update({
            where: { id: found.id },
            data: payload,
          });
          keepIds.add(found.id);
        } else {
          const created = await tx.priceListItem.create({
            data: withClinicId(
              {
                companyId: input.companyId,
                ...payload,
              },
              clinicId
            ),
          });
          keepIds.add(created.id);
        }
        saved += 1;
      }

      for (const row of existing) {
        if (!keepIds.has(row.id)) {
          await tx.priceListItem.delete({ where: { id: row.id } });
        }
      }
    });

    revalidatePath(`/dashboard/empresas/${input.companyId}`);
    revalidatePath("/dashboard/empresas");
    return { success: true, saved };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Informe o preço")) {
      return { success: false, error: e.message };
    }
    return { success: false, error: actionError(e, "Erro ao salvar pacote.") };
  }
}

export async function updateCompanyPackageItem(input: {
  companyId: string;
  itemId: string;
  negotiatedPrice: number;
  validFrom?: string | null;
  validUntil?: string | null;
  status?: PriceListStatus;
}): Promise<Result> {
  try {
    const session = await requirePermission("pricing.manage");
    const item = await prisma.priceListItem.findFirst({
      where: scopedWhere(session, { id: input.itemId, companyId: input.companyId }),
    });
    if (!item) return { success: false, error: "Item do pacote não encontrado." };
    if (!(input.negotiatedPrice > 0)) {
      return { success: false, error: "Informe um preço negociado válido." };
    }

    await prisma.priceListItem.update({
      where: { id: item.id },
      data: {
        negotiatedPrice: input.negotiatedPrice,
        validFrom:
          input.validFrom !== undefined
            ? input.validFrom
              ? new Date(input.validFrom)
              : null
            : item.validFrom,
        validUntil:
          input.validUntil !== undefined
            ? input.validUntil
              ? new Date(input.validUntil)
              : null
            : item.validUntil,
        status: input.status ?? item.status,
      },
    });

    await prisma.priceListHistory.create({
      data: {
        priceListItemId: item.id,
        oldPrice: item.negotiatedPrice ?? item.defaultPrice,
        newPrice: input.negotiatedPrice,
        changedByUserId: session.user.id,
        notes: "Ajuste de valor do pacote da empresa",
      },
    });

    revalidatePath(`/dashboard/empresas/${input.companyId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar valor.") };
  }
}

export async function removeCompanyPackageItem(input: {
  companyId: string;
  itemId: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("pricing.manage");
    const item = await prisma.priceListItem.findFirst({
      where: scopedWhere(session, { id: input.itemId, companyId: input.companyId }),
      select: { id: true },
    });
    if (!item) return { success: false, error: "Item do pacote não encontrado." };

    await prisma.priceListItem.delete({ where: { id: item.id } });
    revalidatePath(`/dashboard/empresas/${input.companyId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao remover do pacote.") };
  }
}
