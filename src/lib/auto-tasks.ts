import "server-only";

import { prisma } from "@/lib/prisma";
import type { TaskPriority } from "@prisma/client";
import { withClinicId } from "@/lib/scoped-db";

/** Cria tarefa automática vinculada a um módulo (sem notificação duplicada). */
export async function createAutoTask(input: {
  clinicId: string | null;
  createdByUserId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  companyId?: string;
  assignedToUserId?: string;
}) {
  return prisma.task.create({
    data: withClinicId(
      {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        priority: input.priority ?? "MEDIA",
        dueDate: input.dueDate ?? null,
        companyId: input.companyId || null,
        assignedToUserId: input.assignedToUserId || null,
        createdByUserId: input.createdByUserId,
        status: "PENDENTE",
      },
      input.clinicId
    ),
  });
}

export async function getSettingBool(clinicId: string | null, key: string, defaultValue = false) {
  if (!clinicId) return defaultValue;
  const row = await prisma.setting.findUnique({
    where: { clinicId_key: { clinicId, key } },
  });
  if (!row) return defaultValue;
  return row.value === "true" || row.value === "1";
}
