"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { MonthlyClosingStatus } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import {
  competenceToDate,
  formatCompetence,
  isCriticalSituation,
  resolveClosingWorkflowStatus,
} from "@/lib/closings";

type Result<T extends Record<string, unknown> = { id: string }> =
  | ({ success: true } & T)
  | { success: false; error: string };

export type ClosingLineSerialized = {
  id: string;
  patientName: string | null;
  serviceName: string;
  serviceDate: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  situation: string;
  hasPrice: boolean;
};

export type ClosingDetailSerialized = {
  id: string;
  referenceMonth: string;
  competenceLabel: string;
  status: MonthlyClosingStatus;
  totalAmount: number | null;
  importedCount: number;
  withoutPriceCount: number;
  divergenceCount: number;
  companyId: string | null;
  companyName: string;
  hasFinancialEntry: boolean;
  criticalCount: number;
  lineItems: ClosingLineSerialized[];
};

function situationFromNotes(notes: string | null | undefined): string {
  if (!notes) return "OK";
  if (notes.startsWith("SIT:")) return notes.slice(4).split("|")[0] || "OK";
  return notes;
}

export async function createMonthlyClosing(input: {
  referenceMonth: string;
  companyId: string;
  notes?: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("closings.manage");
    const clinicId = await resolveClinicId(session);
    if (!input.companyId) {
      return { success: false, error: "Selecione a empresa do fechamento." };
    }

    const company = await prisma.company.findFirst({
      where: scopedWhere(session, { id: input.companyId }),
      select: { id: true },
    });
    if (!company) return { success: false, error: "Empresa não encontrada." };

    const month = competenceToDate(input.referenceMonth);
    const closing = await prisma.monthlyClosing.create({
      data: withClinicId(
        {
          referenceMonth: month,
          companyId: company.id,
          notes: input.notes?.trim() || null,
          createdByUserId: session.user.id,
          status: "EM_CONFERENCIA",
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

export async function getClosingDetail(id: string): Promise<ClosingDetailSerialized | null> {
  const session = await requirePermission("closings.manage");
  const closing = await prisma.monthlyClosing.findFirst({
    where: scopedWhere(session, { id }),
    include: {
      company: { select: { tradeName: true, legalName: true } },
      lineItems: { orderBy: [{ serviceDate: "asc" }, { patientName: "asc" }] },
      entries: { where: { type: "RECEBER" }, select: { id: true }, take: 1 },
    },
  });
  if (!closing) return null;

  const lineItems: ClosingLineSerialized[] = closing.lineItems.map((item) => {
    const situation = situationFromNotes(item.notes);
    const hasPrice = item.unitPrice > 0 && situation !== "SEM_PRECO";
    return {
      id: item.id,
      patientName: item.patientName,
      serviceName: item.serviceName,
      serviceDate: item.serviceDate?.toISOString() ?? null,
      quantity: item.quantity,
      unitPrice: hasPrice ? item.unitPrice : null,
      totalPrice: hasPrice ? item.totalPrice : null,
      situation,
      hasPrice,
    };
  });

  const criticalCount = lineItems.filter((i) => isCriticalSituation(i.situation)).length;

  return {
    id: closing.id,
    referenceMonth: closing.referenceMonth.toISOString(),
    competenceLabel: formatCompetence(closing.referenceMonth),
    status: closing.status,
    totalAmount: closing.totalAmount,
    importedCount: closing.importedCount,
    withoutPriceCount: closing.withoutPriceCount,
    divergenceCount: closing.divergenceCount,
    companyId: closing.companyId,
    companyName: closing.company?.tradeName ?? closing.company?.legalName ?? "—",
    hasFinancialEntry: closing.entries.length > 0,
    criticalCount,
    lineItems,
  };
}

export async function closeMonthlyClosing(id: string): Promise<Result> {
  try {
    const session = await requirePermission("closings.manage");
    const detail = await getClosingDetail(id);
    if (!detail) return { success: false, error: "Fechamento não encontrado." };

    if (detail.criticalCount > 0) {
      return {
        success: false,
        error: `Não é possível fechar: há ${detail.criticalCount} divergência(s) crítica(s). Corrija as pendências antes.`,
      };
    }

    if (["FECHADO", "FATURADO", "PAGO"].includes(detail.status)) {
      return { success: false, error: "Este fechamento já está fechado." };
    }

    const total = detail.lineItems
      .filter((i) => i.hasPrice)
      .reduce((sum, i) => sum + (i.totalPrice ?? 0), 0);

    await prisma.monthlyClosing.updateMany({
      where: scopedWhere(session, { id }),
      data: {
        status: "FECHADO",
        totalAmount: total,
        withoutPriceCount: 0,
        divergenceCount: 0,
      },
    });

    revalidatePath("/dashboard/fechamento-mensal");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao fechar competência.") };
  }
}

export async function reopenMonthlyClosing(id: string): Promise<Result> {
  try {
    const session = await requirePermission("closings.manage");
    const closing = await prisma.monthlyClosing.findFirst({
      where: scopedWhere(session, { id }),
      include: { lineItems: { select: { notes: true } }, entries: { select: { id: true, status: true } } },
    });
    if (!closing) return { success: false, error: "Fechamento não encontrado." };

    if (closing.status === "FATURADO" || closing.entries.some((e) => e.status === "PAGO")) {
      return {
        success: false,
        error: "Não é possível reabrir um fechamento já enviado/pago no Financeiro.",
      };
    }

    const criticalCount = closing.lineItems.filter((i) =>
      isCriticalSituation(situationFromNotes(i.notes))
    ).length;

    await prisma.monthlyClosing.updateMany({
      where: scopedWhere(session, { id }),
      data: {
        status: criticalCount > 0 ? "COM_DIVERGENCIA" : "EM_CONFERENCIA",
      },
    });

    revalidatePath("/dashboard/fechamento-mensal");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao reabrir fechamento.") };
  }
}

/** Envia o valor final ao Financeiro (cria conta a receber uma única vez). */
export async function sendClosingToFinance(
  id: string
): Promise<Result<{ id: string; entryId: string }>> {
  try {
    const session = await requirePermission("closings.manage");
    const clinicId = await resolveClinicId(session);
    const closing = await prisma.monthlyClosing.findFirst({
      where: scopedWhere(session, { id }),
      include: {
        company: { select: { tradeName: true, legalName: true } },
        lineItems: true,
        entries: { where: { type: "RECEBER", source: "FECHAMENTO" }, select: { id: true } },
      },
    });
    if (!closing) return { success: false, error: "Fechamento não encontrado." };
    if (!closing.companyId) {
      return { success: false, error: "Fechamento sem empresa vinculada." };
    }
    if (closing.status !== "FECHADO" && closing.status !== "FATURADO") {
      return { success: false, error: "Feche a competência antes de enviar ao Financeiro." };
    }

    const criticalCount = closing.lineItems.filter((i) =>
      isCriticalSituation(situationFromNotes(i.notes))
    ).length;
    if (criticalCount > 0) {
      return { success: false, error: "Há divergências críticas. Não é possível gerar cobrança." };
    }

    if (closing.entries.length > 0) {
      await prisma.monthlyClosing.updateMany({
        where: scopedWhere(session, { id }),
        data: { status: "FATURADO" },
      });
      revalidatePath("/dashboard/fechamento-mensal");
      revalidatePath("/dashboard/financeiro");
      return { success: true, id, entryId: closing.entries[0].id };
    }

    const total =
      closing.totalAmount ??
      closing.lineItems
        .filter((i) => situationFromNotes(i.notes) !== "SEM_PRECO" && i.unitPrice > 0)
        .reduce((sum, i) => sum + i.totalPrice, 0);

    if (!(total > 0)) {
      return { success: false, error: "Valor total inválido para envio ao Financeiro." };
    }

    const due = new Date(closing.referenceMonth);
    due.setMonth(due.getMonth() + 1);
    due.setDate(10);

    const companyLabel = closing.company?.tradeName ?? closing.company?.legalName ?? "Empresa";
    const entry = await prisma.financialEntry.create({
      data: withClinicId(
        {
          type: "RECEBER",
          source: "FECHAMENTO",
          description: `Fechamento ${formatCompetence(closing.referenceMonth)} — ${companyLabel}`,
          amount: total,
          dueDate: due,
          companyId: closing.companyId,
          closingId: closing.id,
          referenceMonth: closing.referenceMonth,
          status: "AGUARDANDO_FATURAMENTO",
        },
        clinicId
      ),
    });

    await prisma.monthlyClosing.updateMany({
      where: scopedWhere(session, { id }),
      data: { status: "FATURADO", totalAmount: total },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "MonthlyClosing",
      entityId: closing.id,
      details: "Enviado ao Financeiro",
    });

    revalidatePath("/dashboard/fechamento-mensal");
    revalidatePath("/dashboard/financeiro");
    return { success: true, id, entryId: entry.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao enviar ao Financeiro.") };
  }
}

export async function updateMonthlyClosingStatus(
  id: string,
  status: MonthlyClosingStatus
): Promise<Result> {
  try {
    const session = await requirePermission("closings.manage");
    await prisma.monthlyClosing.updateMany({
      where: scopedWhere(session, { id }),
      data: { status },
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

export async function refreshClosingComputedStatus(id: string): Promise<Result> {
  try {
    const session = await requirePermission("closings.manage");
    const closing = await prisma.monthlyClosing.findFirst({
      where: scopedWhere(session, { id }),
      include: { lineItems: { select: { notes: true, unitPrice: true, totalPrice: true } } },
    });
    if (!closing) return { success: false, error: "Fechamento não encontrado." };
    if (["FECHADO", "FATURADO", "PAGO", "CANCELADO"].includes(closing.status)) {
      return { success: true, id };
    }

    const situations = closing.lineItems.map((i) => situationFromNotes(i.notes));
    const withoutPrice = situations.filter((s) => s === "SEM_PRECO").length;
    const divergences = situations.filter((s) => s === "DIVERGENCIA" || s === "DUPLICADO").length;
    const status = resolveClosingWorkflowStatus({
      withoutPriceCount: withoutPrice,
      divergenceCount: divergences,
    });
    const total = closing.lineItems
      .filter((i) => situationFromNotes(i.notes) !== "SEM_PRECO" && i.unitPrice > 0)
      .reduce((sum, i) => sum + i.totalPrice, 0);

    await prisma.monthlyClosing.updateMany({
      where: scopedWhere(session, { id }),
      data: {
        status,
        withoutPriceCount: withoutPrice,
        divergenceCount: divergences,
        totalAmount: total,
      },
    });

    revalidatePath("/dashboard/fechamento-mensal");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar status.") };
  }
}
