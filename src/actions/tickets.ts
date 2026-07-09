"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TicketPriority, TicketScope, TicketStatus } from "@prisma/client";
import { requirePermission, requireSession, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { createNotification } from "@/lib/notifications";
import { isSuperAdmin } from "@/lib/tenant";
import { buildTicketWhere, getTicketPageSize, type TicketFilters } from "@/lib/tickets";

type Result = { success: true; id: string } | { success: false; error: string };

export async function listTicketsDashboard(
  filters: TicketFilters = {},
  scope: TicketScope = "CLINIC"
) {
  const session = await requireSession();
  if (scope === "CLINIC") await requirePermission("tickets.manage");
  const baseScope =
    scope === "SAAS" && isSuperAdmin(session.user.role)
      ? { scope: "SAAS" as const }
      : scopedWhere(session, { scope });
  const pageSize = getTicketPageSize();
  const page = Math.max(1, filters.page ?? 1);
  const where = { ...baseScope, ...buildTicketWhere(filters, scope) };

  const [items, total, statCounts] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
        company: { select: { tradeName: true, legalName: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.ticket.count({ where }),
    Promise.all([
      prisma.ticket.count({ where: { ...baseScope, status: "ABERTO" } }),
      prisma.ticket.count({ where: { ...baseScope, status: "EM_ATENDIMENTO" } }),
      prisma.ticket.count({ where: { ...baseScope, status: "AGUARDANDO_CLIENTE" } }),
      prisma.ticket.count({ where: { ...baseScope, status: "RESOLVIDO" } }),
      prisma.ticket.count({ where: { ...baseScope, status: "FECHADO" } }),
      prisma.ticket.count({
        where: {
          ...baseScope,
          priority: "ALTA",
          status: { in: ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] },
        },
      }),
    ]).then(([abertos, em_atendimento, aguardando, resolvidos, fechados, alta_prioridade]) => ({
      abertos,
      em_atendimento,
      aguardando,
      resolvidos,
      fechados,
      alta_prioridade,
    })),
  ]);

  return {
    items: items.map((t) => ({
      id: t.id,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      category: t.category,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      createdByName: t.createdBy.name,
      assignedTo: t.assignedTo,
      companyName: t.company?.tradeName ?? t.company?.legalName ?? null,
      commentCount: t._count.comments,
    })),
    total,
    page,
    pageSize,
    statCounts,
  };
}

export async function getTicketDetail(id: string) {
  const session = await requireSession();
  const where = isSuperAdmin(session.user.role) ? { id } : scopedWhere(session, { id });
  const ticket = await prisma.ticket.findFirst({
    where,
    include: {
      createdBy: { select: { name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      company: { select: { tradeName: true, legalName: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
  if (!ticket) return { success: false as const, error: "Chamado não encontrado." };
  return {
    success: true as const,
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      createdBy: ticket.createdBy,
      assignedTo: ticket.assignedTo,
      companyName: ticket.company?.tradeName ?? ticket.company?.legalName ?? null,
      comments: ticket.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdByName: c.createdBy.name,
        createdAt: c.createdAt.toISOString(),
      })),
    },
  };
}

export async function createTicket(input: {
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: string;
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
          category: input.category?.trim() || null,
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

export async function updateTicket(input: {
  id: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedToUserId?: string | null;
}): Promise<Result> {
  try {
    const session = await requirePermission("tickets.manage");
    const where = scopedWhere(session, { id: input.id });
    const data: Record<string, unknown> = {};
    if (input.status) data.status = input.status;
    if (input.priority) data.priority = input.priority;
    if (input.category !== undefined) data.category = input.category?.trim() || null;
    if (input.assignedToUserId !== undefined) data.assignedToUserId = input.assignedToUserId;
    await prisma.ticket.updateMany({ where, data });
    if (input.assignedToUserId) {
      await createNotification({
        userId: input.assignedToUserId,
        title: "Chamado atribuído",
        message: "Um chamado foi atribuído a você.",
        link: "/dashboard/chamados",
        sendEmail: true,
      });
    }
    revalidatePath("/dashboard/chamados");
    return { success: true, id: input.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar chamado.") };
  }
}

export async function assignTicket(id: string, assignedToUserId: string | null): Promise<Result> {
  return updateTicket({ id, assignedToUserId });
}

export async function addTicketComment(ticketId: string, content: string): Promise<Result> {
  try {
    const session = await requireSession();
    if (!content.trim()) return { success: false, error: "Mensagem obrigatória." };
    const where = isSuperAdmin(session.user.role)
      ? { id: ticketId }
      : scopedWhere(session, { id: ticketId });
    const ticket = await prisma.ticket.findFirst({ where });
    if (!ticket) return { success: false, error: "Chamado não encontrado." };
    await prisma.ticketComment.create({
      data: {
        ticketId,
        content: content.trim(),
        createdByUserId: session.user.id,
      },
    });
    if (ticket.status === "ABERTO") {
      await prisma.ticket.update({ where: { id: ticketId }, data: { status: "EM_ATENDIMENTO" } });
    }
    revalidatePath("/dashboard/chamados");
    return { success: true, id: ticketId };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao enviar mensagem.") };
  }
}
