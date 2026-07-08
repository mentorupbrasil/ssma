"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { MonthlyClosingStatus } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";

type Result = { success: true; id: string } | { success: false; error: string };

export async function createMonthlyClosing(input: {
  referenceMonth: string;
  companyId?: string;
  notes?: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("closings.manage");
    const clinicId = await resolveClinicId(session);
    const month = new Date(input.referenceMonth);
    month.setDate(1);
    month.setHours(0, 0, 0, 0);
    const closing = await prisma.monthlyClosing.create({
      data: withClinicId(
        {
          referenceMonth: month,
          companyId: input.companyId || null,
          notes: input.notes?.trim() || null,
          createdByUserId: session.user.id,
          status: "RASCUNHO",
        },
        clinicId
      ),
    });
    await createAuditLog({ action: "CREATE", entity: "MonthlyClosing", entityId: closing.id });
    revalidatePath("/dashboard/fechamento-mensal");
    return { success: true, id: closing.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao criar fechamento.") };
  }
}

export async function updateMonthlyClosingStatus(
  id: string,
  status: MonthlyClosingStatus
): Promise<Result> {
  try {
    const session = await requirePermission("closings.manage");
    const where = scopedWhere(session, { id });
    const total = await prisma.financialEntry.aggregate({
      where: { closingId: id, type: "RECEBER" },
      _sum: { amount: true },
    });
    await prisma.monthlyClosing.updateMany({
      where,
      data: { status, totalAmount: total._sum.amount ?? 0 },
    });
    revalidatePath("/dashboard/fechamento-mensal");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar fechamento.") };
  }
}

export async function deleteMonthlyClosing(id: string): Promise<Result> {
  try {
    const session = await requirePermission("closings.manage");
    const where = scopedWhere(session, { id });
    await prisma.financialEntry.updateMany({ where: { closingId: id }, data: { closingId: null } });
    await prisma.monthlyClosing.deleteMany({ where });
    revalidatePath("/dashboard/fechamento-mensal");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao excluir fechamento.") };
  }
}
