"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { createNotification } from "@/lib/notifications";

type Result = { success: true; id: string } | { success: false; error: string };

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

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Result> {
  try {
    const session = await requirePermission("tasks.manage");
    const where = scopedWhere(session, { id });
    await prisma.task.updateMany({ where, data: { status } });
    revalidatePath("/dashboard/tarefas");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar tarefa.") };
  }
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
