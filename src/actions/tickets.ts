"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TicketPriority, TicketScope, TicketStatus } from "@prisma/client";
import { requirePermission, requireSession, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { createNotification } from "@/lib/notifications";
import { isSuperAdmin, isCompanyHr } from "@/lib/tenant";
import {
  buildTicketWhere,
  formatTicketProtocol,
  generateTicketProtocol,
  getTicketPageSize,
  type TicketFilters,
} from "@/lib/tickets";
import { isTasksModuleEnabled } from "@/lib/modules";

type Result = { success: true; id: string } | { success: false; error: string };

export async function listTicketsDashboard(
  filters: TicketFilters = {},
  scope: TicketScope = "CLINIC"
) {
  const session = await requireSession();
  const isEmpresa = isCompanyHr(session.user.role);
  const effectiveScope: TicketScope = isEmpresa ? "SAAS" : scope;

  if (effectiveScope === "CLINIC") {
    await requirePermission("tickets.manage");
  } else if (!isEmpresa && !isSuperAdmin(session.user.role)) {
    throw new Error("FORBIDDEN");
  }

  const baseScope =
    effectiveScope === "SAAS" && isSuperAdmin(session.user.role)
      ? { scope: "SAAS" as const }
      : effectiveScope === "SAAS" && isEmpresa
        ? { scope: "SAAS" as const, companyId: session.user.companyId ?? undefined }
        : scopedWhere(session, { scope: effectiveScope });
  const pageSize = getTicketPageSize();
  const page = Math.max(1, filters.page ?? 1);
  const where = { ...baseScope, ...buildTicketWhere(filters, effectiveScope) };

  const [items, total, statCounts] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
        company: { select: { id: true, tradeName: true, legalName: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.ticket.count({ where }),
    // Mantido para o portal RH
    Promise.all([
      prisma.ticket.count({ where: { ...baseScope, status: "ABERTO" } }),
      prisma.ticket.count({ where: { ...baseScope, status: "EM_ATENDIMENTO" } }),
      prisma.ticket.count({ where: { ...baseScope, status: "AGUARDANDO_CLIENTE" } }),
      prisma.ticket.count({ where: { ...baseScope, status: "RESOLVIDO" } }),
      prisma.ticket.count({ where: { ...baseScope, status: "FECHADO" } }),
      prisma.ticket.count({
        where: {
          ...baseScope,
          priority: { in: ["ALTA", "URGENTE"] },
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
      protocol: formatTicketProtocol(t.protocol, t.id),
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      category: t.category,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      createdByName: t.createdBy.name,
      assignedTo: t.assignedTo,
      companyId: t.companyId,
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
  const isEmpresa = isCompanyHr(session.user.role);
  const where = isSuperAdmin(session.user.role)
    ? { id }
    : isEmpresa
      ? { id, scope: "SAAS" as const, companyId: session.user.companyId ?? undefined }
      : scopedWhere(session, { id });
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

  const comments = ticket.comments
    .filter((c) => (isEmpresa ? !c.isInternal : true))
    .map((c) => ({
      id: c.id,
      content: c.content,
      isInternal: c.isInternal,
      attachmentUrl: c.attachmentUrl,
      createdByName: c.createdBy.name,
      createdAt: c.createdAt.toISOString(),
    }));

  return {
    success: true as const,
    ticket: {
      id: ticket.id,
      protocol: formatTicketProtocol(ticket.protocol, ticket.id),
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      createdBy: ticket.createdBy,
      assignedTo: ticket.assignedTo,
      companyId: ticket.companyId,
      companyName: ticket.company?.tradeName ?? ticket.company?.legalName ?? null,
      comments,
      attachments: comments.filter((c) => c.attachmentUrl).map((c) => ({
        id: c.id,
        url: c.attachmentUrl!,
        createdByName: c.createdByName,
        createdAt: c.createdAt,
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
    const isEmpresa = isCompanyHr(session.user.role);
    const scope: TicketScope = isEmpresa ? "SAAS" : (input.scope ?? "CLINIC");

    if (scope === "CLINIC") {
      await requirePermission("tickets.manage");
    }

    const clinicId = scope === "SAAS" ? null : await resolveClinicId(session);
    const companyId = isEmpresa ? session.user.companyId ?? null : input.companyId || null;
    const ticket = await prisma.ticket.create({
      data: withClinicId(
        {
          protocol: generateTicketProtocol(),
          subject: input.subject.trim(),
          description: input.description.trim(),
          priority: input.priority ?? "MEDIA",
          category: input.category?.trim() || null,
          scope,
          companyId,
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
    if (isCompanyHr(session.user.role)) {
      return { success: false, error: "Sem permissão para alterar status." };
    }
    const where = isSuperAdmin(session.user.role)
      ? { id }
      : scopedWhere(session, { id });
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
    const where = isSuperAdmin(session.user.role)
      ? { id: input.id }
      : scopedWhere(session, { id: input.id });
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
        link: `/dashboard/chamados?id=${input.id}`,
        sendEmail: true,
      });
    }
    revalidatePath("/dashboard/chamados");
    revalidatePath("/super-admin/chamados");
    return { success: true, id: input.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar chamado.") };
  }
}

export async function assignTicket(id: string, assignedToUserId: string | null): Promise<Result> {
  return updateTicket({ id, assignedToUserId });
}

export async function addTicketComment(
  ticketId: string,
  content: string,
  options?: { isInternal?: boolean; attachmentUrl?: string }
): Promise<Result> {
  try {
    const session = await requireSession();
    const isEmpresa = isCompanyHr(session.user.role);
    if (!content.trim() && !options?.attachmentUrl?.trim()) {
      return { success: false, error: "Mensagem obrigatória." };
    }
    if (options?.isInternal && isEmpresa) {
      return { success: false, error: "Sem permissão para observação interna." };
    }

    const where = isSuperAdmin(session.user.role)
      ? { id: ticketId }
      : isEmpresa
        ? { id: ticketId, scope: "SAAS" as const, companyId: session.user.companyId ?? undefined }
        : scopedWhere(session, { id: ticketId });
    const ticket = await prisma.ticket.findFirst({ where });
    if (!ticket) return { success: false, error: "Chamado não encontrado." };

    await prisma.ticketComment.create({
      data: {
        ticketId,
        content: content.trim() || (options?.attachmentUrl ? "Anexo" : ""),
        isInternal: options?.isInternal ?? false,
        attachmentUrl: options?.attachmentUrl?.trim() || null,
        createdByUserId: session.user.id,
      },
    });

    const nextStatus =
      !options?.isInternal && ticket.status === "ABERTO"
        ? "EM_ATENDIMENTO"
        : !options?.isInternal && isEmpresa && ticket.status === "EM_ATENDIMENTO"
          ? "AGUARDANDO_CLIENTE"
          : undefined;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
        ...(nextStatus ? { status: nextStatus } : {}),
      },
    });

    revalidatePath("/dashboard/chamados");
    revalidatePath("/super-admin/chamados");
    return { success: true, id: ticketId };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao enviar mensagem.") };
  }
}

export async function createTaskFromTicket(ticketId: string): Promise<Result> {
  try {
    if (!isTasksModuleEnabled()) {
      return { success: false, error: "Módulo de tarefas está desativado." };
    }
    const session = await requirePermission("tickets.manage");
    const where = isSuperAdmin(session.user.role)
      ? { id: ticketId }
      : scopedWhere(session, { id: ticketId });
    const ticket = await prisma.ticket.findFirst({ where });
    if (!ticket) return { success: false, error: "Chamado não encontrado." };

    const sourceKey = `ticket:${ticket.id}`;
    const existing = await prisma.task.findFirst({
      where: {
        sourceKey,
        status: { in: ["PENDENTE", "EM_ANDAMENTO"] },
      },
      select: { id: true },
    });
    if (existing) return { success: true, id: existing.id };

    const clinicId = await resolveClinicId(session);
    const protocol = formatTicketProtocol(ticket.protocol, ticket.id);
    const task = await prisma.task.create({
      data: withClinicId(
        {
          title: `Chamado ${protocol}: ${ticket.subject}`,
          description: ticket.description,
          priority:
            ticket.priority === "URGENTE" || ticket.priority === "ALTA"
              ? "URGENTE"
              : ticket.priority === "MEDIA"
                ? "MEDIA"
                : "BAIXA",
          companyId: ticket.companyId,
          assignedToUserId: ticket.assignedToUserId,
          createdByUserId: session.user.id,
          origin: "CHAMADO",
          linkUrl: `/dashboard/chamados?id=${ticket.id}`,
          systemGenerated: false,
          sourceKey,
        },
        clinicId
      ),
    });

    revalidatePath("/dashboard/tarefas");
    revalidatePath("/dashboard/chamados");
    return { success: true, id: task.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao criar tarefa.") };
  }
}
