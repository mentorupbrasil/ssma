"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PriceChargeType, PriceItemCategory, PriceListStatus } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { effectivePrice } from "@/lib/pricing";
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
