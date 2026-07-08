"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TicketPriority, TicketScope, TicketStatus } from "@prisma/client";
import { requirePermission, requireSession, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { createNotification } from "@/lib/notifications";
import { isSuperAdmin } from "@/lib/tenant";

type Result = { success: true; id: string } | { success: false; error: string };

export async function createTicket(input: {
  subject: string;
  description: string;
  priority?: TicketPriority;
  scope?: TicketScope;
  companyId?: string;
}): Promise<Result> {
  try {
    const session = await requireSession();
    const canManage = isSuperAdmin(session.user.role) || input.scope !== "SAAS";
    if (!canManage && !session.user.role) {
      return { success: false, error: "Sem permissão." };
    }
    const clinicId = input.scope === "SAAS" ? null : await resolveClinicId(session);
    const ticket = await prisma.ticket.create({
      data: withClinicId(
        {
          subject: input.subject.trim(),
          description: input.description.trim(),
          priority: input.priority ?? "MEDIA",
          scope: input.scope ?? "CLINIC",
          companyId: input.companyId || null,
          createdByUserId: session.user.id,
        },
        clinicId
      ),
    });
    await createAuditLog({ action: "CREATE", entity: "Ticket", entityId: ticket.id });
    revalidatePath("/dashboard/chamados");
    revalidatePath("/super-admin/chamados");
    return { success: true, id: ticket.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao abrir chamado.") };
  }
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<Result> {
  try {
    const session = await requireSession();
    const where = isSuperAdmin(session.user.role)
      ? { id }
      : scopedWhere(session, { id, scope: "CLINIC" as const });
    await prisma.ticket.updateMany({ where, data: { status } });
    revalidatePath("/dashboard/chamados");
    revalidatePath("/super-admin/chamados");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar chamado.") };
  }
}

export async function assignTicket(id: string, assignedToUserId: string | null): Promise<Result> {
  try {
    const session = await requirePermission("tickets.manage");
    const where = scopedWhere(session, { id });
    await prisma.ticket.updateMany({ where, data: { assignedToUserId } });
    if (assignedToUserId) {
      await createNotification({
        userId: assignedToUserId,
        title: "Chamado atribuído",
        message: "Um chamado foi atribuído a você.",
        link: "/dashboard/chamados",
        sendEmail: true,
      });
    }
    revalidatePath("/dashboard/chamados");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atribuir chamado.") };
  }
}
