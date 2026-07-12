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

export type CompanyPriceRow = {
  key: string;
  priceId: string;
  examId: string | null;
  name: string;
  companyId: string;
  companyName: string;
  defaultPrice: number | null;
  negotiatedPrice: number | null;
  status: PriceListStatus;
  updatedAt: string;
  notes: string | null;
  code: string | null;
  category: PriceItemCategory;
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

/** Catálogo unificado: exames do sistema + preços padrão (serviços avulsos). */
export async function listPriceCatalog(): Promise<{
  defaults: PriceCatalogRow[];
  companyItems: CompanyPriceRow[];
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
      where: scope,
      include: {
        company: { select: { id: true, tradeName: true, legalName: true } },
        exam: { select: { id: true, name: true } },
      },
      orderBy: [{ name: "asc" }],
    }),
  ]);

  const defaultByExamId = new Map<string, (typeof priceItems)[number]>();
  const defaultByName = new Map<string, (typeof priceItems)[number]>();
  const defaultsStandalone: (typeof priceItems)[number][] = [];
  const companyItemsRaw: (typeof priceItems)[number][] = [];

  for (const item of priceItems) {
    if (item.companyId) {
      companyItemsRaw.push(item);
      continue;
    }
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
    // Skip if already shown via name match to an exam
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

  const companyItems: CompanyPriceRow[] = companyItemsRaw.map((item) => {
    const base =
      (item.examId ? defaultByExamId.get(item.examId) : null) ??
      defaultByName.get(item.name.trim().toLowerCase()) ??
      null;
    return {
      key: `price:${item.id}`,
      priceId: item.id,
      examId: item.examId,
      name: item.name,
      companyId: item.companyId!,
      companyName: item.company?.tradeName ?? item.company?.legalName ?? "—",
      defaultPrice: base && base.defaultPrice > 0 ? base.defaultPrice : null,
      negotiatedPrice:
        item.negotiatedPrice != null && item.negotiatedPrice > 0
          ? item.negotiatedPrice
          : item.negotiatedPrice === 0
            ? null
            : item.negotiatedPrice,
      status: item.status,
      updatedAt: item.updatedAt.toISOString(),
      notes: item.notes,
      code: item.code,
      category: item.category,
      chargeType: item.chargeType,
      validFrom: item.validFrom?.toISOString() ?? null,
      validUntil: item.validUntil?.toISOString() ?? null,
    };
  });

  companyItems.sort((a, b) =>
    a.companyName.localeCompare(b.companyName, "pt-BR") || a.name.localeCompare(b.name, "pt-BR")
  );

  return { defaults, companyItems };
}

export async function upsertCatalogPrice(input: {
  priceId?: string | null;
  examId?: string | null;
  name: string;
  category?: PriceItemCategory;
  defaultPrice: number | null;
  status?: PriceListStatus;
  notes?: string;
  companyId?: string | null;
  negotiatedPrice?: number | null;
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
      const where = scopedWhere(session, { id: input.priceId });
      const existing = await prisma.priceListItem.findFirst({ where });
      if (!existing) return { success: false, error: "Item não encontrado." };

      const newPrice = input.companyId
        ? input.negotiatedPrice ?? priceValue
        : priceValue;
      const oldPrice = effectivePrice(existing);

      await prisma.priceListItem.updateMany({
        where,
        data: {
          name: input.name.trim(),
          category: input.category ?? existing.category,
          examId: input.examId ?? existing.examId,
          defaultPrice: input.companyId ? existing.defaultPrice : priceValue,
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
            priceListItemId: input.priceId,
            oldPrice,
            newPrice,
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
      const where = scopedWhere(session, { id: input.priceId });
      await prisma.priceListItem.updateMany({
        where,
        data: { status: nextStatus },
      });
      revalidatePath("/dashboard/tabela-precos");
      return { success: true, id: input.priceId };
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
