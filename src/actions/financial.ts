"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { FinancialEntryStatus, FinancialEntryType } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";

type Result = { success: true; id: string } | { success: false; error: string };

export async function createFinancialEntry(input: {
  type: FinancialEntryType;
  description: string;
  amount: number;
  dueDate: string;
  category?: string;
  companyId?: string;
  closingId?: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("financial.manage");
    const clinicId = await resolveClinicId(session);
    const entry = await prisma.financialEntry.create({
      data: withClinicId(
        {
          type: input.type,
          description: input.description.trim(),
          amount: input.amount,
          dueDate: new Date(input.dueDate),
          category: input.category?.trim() || null,
          companyId: input.companyId || null,
          closingId: input.closingId || null,
          status: "PENDENTE",
        },
        clinicId
      ),
    });
    await createAuditLog({ action: "CREATE", entity: "FinancialEntry", entityId: entry.id });
    revalidatePath("/dashboard/financeiro");
    return { success: true, id: entry.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao lançar movimentação.") };
  }
}

export async function updateFinancialEntryStatus(
  id: string,
  status: FinancialEntryStatus,
  paidAt?: string
): Promise<Result> {
  try {
    const session = await requirePermission("financial.manage");
    const where = scopedWhere(session, { id });
    await prisma.financialEntry.updateMany({
      where,
      data: {
        status,
        paidAt: status === "PAGO" ? (paidAt ? new Date(paidAt) : new Date()) : null,
      },
    });
    revalidatePath("/dashboard/financeiro");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar lançamento.") };
  }
}

export async function deleteFinancialEntry(id: string): Promise<Result> {
  try {
    const session = await requirePermission("financial.manage");
    const where = scopedWhere(session, { id });
    await prisma.financialEntry.deleteMany({ where });
    revalidatePath("/dashboard/financeiro");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao excluir lançamento.") };
  }
}
