"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { FinancialEntryStatus, FinancialEntryType } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { competenceToDate } from "@/lib/closings";
import { encodeReceiptRef } from "@/lib/financial";

type Result = { success: true; id: string } | { success: false; error: string };

export async function createFinancialEntry(input: {
  type: FinancialEntryType;
  source?: import("@prisma/client").FinancialEntrySource;
  description: string;
  amount: number;
  dueDate: string;
  category?: string;
  companyId?: string;
  closingId?: string;
  quoteId?: string;
  referenceMonth?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  status?: FinancialEntryStatus;
}): Promise<Result> {
  try {
    const session = await requirePermission("financial.manage");
    const clinicId = await resolveClinicId(session);
    if (!(input.amount > 0)) return { success: false, error: "Informe um valor válido." };
    if (!input.description?.trim()) return { success: false, error: "Informe a descrição." };
    if (!input.dueDate) return { success: false, error: "Informe o vencimento." };

    const entry = await prisma.financialEntry.create({
      data: withClinicId(
        {
          type: input.type,
          source: input.source ?? "AVULSO",
          description: input.description.trim(),
          amount: input.amount,
          dueDate: new Date(input.dueDate),
          category: input.category?.trim() || null,
          companyId: input.companyId || null,
          closingId: input.closingId || null,
          quoteId: input.quoteId || null,
          referenceMonth: input.referenceMonth
            ? competenceToDate(input.referenceMonth)
            : null,
          paymentMethod: input.paymentMethod?.trim() || null,
          invoiceNumber: input.invoiceNumber?.trim() || null,
          status: input.status ?? "PENDENTE",
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

export async function updateFinancialEntry(input: {
  id: string;
  description?: string;
  amount?: number;
  dueDate?: string;
  companyId?: string | null;
  referenceMonth?: string | null;
  paymentMethod?: string | null;
  invoiceNumber?: string | null;
}): Promise<Result> {
  try {
    const session = await requirePermission("financial.manage");
    const entry = await prisma.financialEntry.findFirst({
      where: scopedWhere(session, { id: input.id }),
      include: { closing: { select: { id: true, status: true } } },
    });
    if (!entry) return { success: false, error: "Conta não encontrada." };
    if (entry.status === "CANCELADO" || entry.status === "PAGO") {
      return { success: false, error: "Não é possível editar uma conta recebida ou cancelada." };
    }

    if (input.amount != null && input.amount !== entry.amount) {
      if (entry.closingId) {
        const closingOpen =
          entry.closing &&
          !["FECHADO", "FATURADO", "PAGO"].includes(entry.closing.status);
        if (!closingOpen) {
          return {
            success: false,
            error:
              "O valor desta conta veio do fechamento mensal. Reabra o fechamento para alterar o valor.",
          };
        }
      }
      if (!(input.amount > 0)) return { success: false, error: "Informe um valor válido." };
    }

    await prisma.financialEntry.update({
      where: { id: entry.id },
      data: {
        ...(input.description != null ? { description: input.description.trim() } : {}),
        ...(input.amount != null ? { amount: input.amount } : {}),
        ...(input.dueDate != null ? { dueDate: new Date(input.dueDate) } : {}),
        ...(input.companyId !== undefined ? { companyId: input.companyId || null } : {}),
        ...(input.referenceMonth !== undefined
          ? {
              referenceMonth: input.referenceMonth
                ? competenceToDate(input.referenceMonth)
                : null,
            }
          : {}),
        ...(input.paymentMethod !== undefined
          ? { paymentMethod: input.paymentMethod?.trim() || null }
          : {}),
        ...(input.invoiceNumber !== undefined
          ? { invoiceNumber: input.invoiceNumber?.trim() || null }
          : {}),
      },
    });

    revalidatePath("/dashboard/financeiro");
    return { success: true, id: entry.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao editar conta.") };
  }
}

export async function registerFinancialInvoice(input: {
  id: string;
  invoiceNumber: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("financial.manage");
    const entry = await prisma.financialEntry.findFirst({
      where: scopedWhere(session, { id: input.id }),
    });
    if (!entry) return { success: false, error: "Conta não encontrada." };
    if (entry.status === "CANCELADO" || entry.status === "PAGO") {
      return { success: false, error: "Conta já encerrada." };
    }
    if (!input.invoiceNumber?.trim()) {
      return { success: false, error: "Informe o número da nota/faturamento." };
    }

    await prisma.financialEntry.update({
      where: { id: entry.id },
      data: {
        invoiceNumber: input.invoiceNumber.trim(),
        status:
          entry.status === "AGUARDANDO_FATURAMENTO" ? "PENDENTE" : entry.status,
      },
    });

    revalidatePath("/dashboard/financeiro");
    return { success: true, id: entry.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao registrar faturamento.") };
  }
}

export async function markFinancialReceived(input: {
  id: string;
  paidAt?: string;
  paymentMethod?: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("financial.manage");
    const entry = await prisma.financialEntry.findFirst({
      where: scopedWhere(session, { id: input.id }),
    });
    if (!entry) return { success: false, error: "Conta não encontrada." };
    if (entry.status === "CANCELADO") {
      return { success: false, error: "Conta cancelada." };
    }
    if (entry.status === "PAGO") {
      return { success: true, id: entry.id };
    }

    await prisma.financialEntry.update({
      where: { id: entry.id },
      data: {
        status: "PAGO",
        paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        paymentMethod: input.paymentMethod?.trim() || entry.paymentMethod,
      },
    });

    revalidatePath("/dashboard/financeiro");
    return { success: true, id: entry.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao marcar como recebida.") };
  }
}

export async function attachFinancialReceipt(input: {
  id: string;
  receiptUrl: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("financial.manage");
    const entry = await prisma.financialEntry.findFirst({
      where: scopedWhere(session, { id: input.id }),
    });
    if (!entry) return { success: false, error: "Conta não encontrada." };
    if (!input.receiptUrl?.trim()) {
      return { success: false, error: "Informe o link ou referência do comprovante." };
    }

    await prisma.financialEntry.update({
      where: { id: entry.id },
      data: { category: encodeReceiptRef(input.receiptUrl) },
    });

    revalidatePath("/dashboard/financeiro");
    return { success: true, id: entry.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao anexar comprovante.") };
  }
}

export async function cancelFinancialEntry(id: string): Promise<Result> {
  try {
    const session = await requirePermission("financial.manage");
    const entry = await prisma.financialEntry.findFirst({
      where: scopedWhere(session, { id }),
    });
    if (!entry) return { success: false, error: "Conta não encontrada." };
    if (entry.status === "PAGO") {
      return { success: false, error: "Não é possível cancelar uma conta já recebida." };
    }

    await prisma.financialEntry.update({
      where: { id: entry.id },
      data: { status: "CANCELADO", paidAt: null },
    });

    revalidatePath("/dashboard/financeiro");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao cancelar conta.") };
  }
}

export async function updateFinancialEntryStatus(
  id: string,
  status: FinancialEntryStatus,
  paidAt?: string
): Promise<Result> {
  if (status === "PAGO") {
    return markFinancialReceived({ id, paidAt });
  }
  if (status === "CANCELADO") {
    return cancelFinancialEntry(id);
  }
  try {
    const session = await requirePermission("financial.manage");
    const where = scopedWhere(session, { id });
    await prisma.financialEntry.updateMany({
      where,
      data: { status, paidAt: null },
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
