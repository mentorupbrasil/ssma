"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId } from "@/lib/scoped-db";
import { createAutoTask, getSettingBool } from "@/lib/auto-tasks";

type Result = { success: true } | { success: false; error: string };

export async function upsertSetting(key: string, value: string): Promise<Result> {
  try {
    const session = await requirePermission("settings.manage");
    const clinicId = await resolveClinicId(session);
    await prisma.setting.upsert({
      where: { clinicId_key: { clinicId, key } },
      create: { clinicId, key, value },
      update: { value },
    });
    await createAuditLog({ action: "UPSERT", entity: "Setting", details: key });
    revalidatePath("/dashboard/configuracoes");
    return { success: true };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao salvar configuração.") };
  }
}

export async function deleteSetting(key: string): Promise<Result> {
  try {
    const session = await requirePermission("settings.manage");
    const clinicId = await resolveClinicId(session);
    await prisma.setting.deleteMany({ where: { clinicId, key } });
    revalidatePath("/dashboard/configuracoes");
    return { success: true };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao excluir configuração.") };
  }
}

export async function upsertSettingsBulk(entries: Record<string, string>): Promise<Result> {
  try {
    const session = await requirePermission("settings.manage");
    const clinicId = await resolveClinicId(session);
    await prisma.$transaction(
      Object.entries(entries).map(([key, value]) =>
        prisma.setting.upsert({
          where: { clinicId_key: { clinicId, key } },
          create: { clinicId, key, value },
          update: { value },
        })
      )
    );
    await createAuditLog({ action: "UPSERT", entity: "Setting", details: "bulk" });
    revalidatePath("/dashboard/configuracoes");
    return { success: true };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao salvar configurações.") };
  }
}
