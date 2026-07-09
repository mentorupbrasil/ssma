"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { createNotification } from "@/lib/notifications";
import { buildTaskWhere, getTaskPageSize, type TaskFilters } from "@/lib/tasks";

type Result = { success: true; id: string } | { success: false; error: string };

export async function listTasksDashboard(filters: TaskFilters = {}) {
  const session = await requirePermission("tasks.manage");
  const scope = scopedWhere(session, {});
  const pageSize = getTaskPageSize();
  const page = Math.max(1, filters.page ?? 1);
  const where = { ...scope, ...buildTaskWhere(filters) };

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(startToday.getTime() + 86400000 - 1);

  const [items, total, statCounts] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        company: { select: { tradeName: true, legalName: true } },
      },
    }),
    prisma.task.count({ where }),
    Promise.all([
      prisma.task.count({ where: { ...scope, status: "PENDENTE" } }),
      prisma.task.count({ where: { ...scope, status: "EM_ANDAMENTO" } }),
      prisma.task.count({ where: { ...scope, status: "CONCLUIDA" } }),
      prisma.task.count({
        where: {
          ...scope,
          status: { in: ["PENDENTE", "EM_ANDAMENTO"] },
          dueDate: { lt: startToday },
        },
      }),
      prisma.task.count({
        where: {
          ...scope,
          status: { in: ["PENDENTE", "EM_ANDAMENTO"] },
          dueDate: { gte: startToday, lte: endToday },
        },
      }),
      prisma.task.count({
        where: {
          ...scope,
          priority: "URGENTE",
          status: { in: ["PENDENTE", "EM_ANDAMENTO"] },
        },
      }),
    ]).then(([pendentes, em_andamento, concluidas, atrasadas, hoje, urgentes]) => ({
      pendentes,
      em_andamento,
      concluidas,
      atrasadas,
      hoje,
      urgentes,
    })),
  ]);

  return {
    items: items.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      assignedTo: t.assignedTo,
      createdByName: t.createdBy.name,
      companyName: t.company?.tradeName ?? t.company?.legalName ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    statCounts,
  };
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  assignedToUserId?: string;
  companyId?: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("tasks.manage");
    const clinicId = await resolveClinicId(session);
    const task = await prisma.task.create({
      data: withClinicId(
        {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          priority: input.priority ?? "MEDIA",
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          assignedToUserId: input.assignedToUserId || null,
          companyId: input.companyId || null,
          createdByUserId: session.user.id,
        },
        clinicId
      ),
    });
    if (input.assignedToUserId && input.assignedToUserId !== session.user.id) {
      await createNotification({
        userId: input.assignedToUserId,
        title: "Nova tarefa atribuída",
        message: input.title.trim(),
        link: "/dashboard/tarefas",
        sendEmail: true,
      });
    }
    await createAuditLog({ action: "CREATE", entity: "Task", entityId: task.id });
    revalidatePath("/dashboard/tarefas");
    return { success: true, id: task.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao criar tarefa.") };
  }
}

export async function updateTask(input: {
  id: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedToUserId?: string | null;
  status?: TaskStatus;
}): Promise<Result> {
  try {
    const session = await requirePermission("tasks.manage");
    const where = scopedWhere(session, { id: input.id });
    const data: Record<string, unknown> = {};
    if (input.title) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.priority) data.priority = input.priority;
    if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (input.assignedToUserId !== undefined) data.assignedToUserId = input.assignedToUserId;
    if (input.status) data.status = input.status;
    await prisma.task.updateMany({ where, data });
    revalidatePath("/dashboard/tarefas");
    return { success: true, id: input.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar tarefa.") };
  }
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Result> {
  return updateTask({ id, status });
}

export async function deleteTask(id: string): Promise<Result> {
  try {
    const session = await requirePermission("tasks.manage");
    const where = scopedWhere(session, { id });
    await prisma.task.deleteMany({ where });
    revalidatePath("/dashboard/tarefas");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao excluir tarefa.") };
  }
}

export async function convertTicketToTask(ticketId: string): Promise<Result> {
  try {
    const session = await requirePermission("tasks.manage");
    const where = scopedWhere(session, { id: ticketId });
    const ticket = await prisma.ticket.findFirst({ where });
    if (!ticket) return { success: false, error: "Chamado não encontrado." };
    const clinicId = await resolveClinicId(session);
    const task = await prisma.task.create({
      data: withClinicId(
        {
          title: `Chamado: ${ticket.subject}`,
          description: ticket.description,
          priority: ticket.priority === "ALTA" ? "URGENTE" : ticket.priority === "MEDIA" ? "MEDIA" : "BAIXA",
          companyId: ticket.companyId,
          assignedToUserId: ticket.assignedToUserId,
          createdByUserId: session.user.id,
        },
        clinicId
      ),
    });
    revalidatePath("/dashboard/tarefas");
    revalidatePath("/dashboard/chamados");
    return { success: true, id: task.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao converter chamado.") };
  }
}
