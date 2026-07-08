"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ClinicPlan, ClinicStatus } from "@prisma/client";
import { requirePermission, actionError, isPrismaUniqueError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";

type Result = { success: true; id: string } | { success: false; error: string };

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createClinic(input: {
  name: string;
  email?: string;
  whatsapp?: string;
  responsibleName?: string;
  plan?: ClinicPlan;
}): Promise<Result> {
  try {
    await requirePermission("superadmin.access");
    const clinic = await prisma.clinic.create({
      data: {
        name: input.name.trim(),
        slug: slugify(input.name),
        email: input.email?.trim() || null,
        whatsapp: input.whatsapp?.trim() || null,
        responsibleName: input.responsibleName?.trim() || null,
        plan: input.plan ?? "TRIAL",
        status: "ATIVA",
      },
    });
    await createAuditLog({ action: "CREATE", entity: "Clinic", entityId: clinic.id });
    revalidatePath("/super-admin/clinicas");
    revalidatePath("/super-admin");
    return { success: true, id: clinic.id };
  } catch (e) {
    if (isPrismaUniqueError(e)) return { success: false, error: "Slug da clínica já existe." };
    return { success: false, error: actionError(e, "Erro ao criar clínica.") };
  }
}

export async function updateClinic(input: {
  id: string;
  name?: string;
  status?: ClinicStatus;
  plan?: ClinicPlan;
  email?: string;
  whatsapp?: string;
}): Promise<Result> {
  try {
    await requirePermission("superadmin.access");
    const data: Record<string, unknown> = {};
    if (input.name) {
      data.name = input.name.trim();
      data.slug = slugify(input.name);
    }
    if (input.status) data.status = input.status;
    if (input.plan) data.plan = input.plan;
    if (input.email !== undefined) data.email = input.email?.trim() || null;
    if (input.whatsapp !== undefined) data.whatsapp = input.whatsapp?.trim() || null;
    await prisma.clinic.update({ where: { id: input.id }, data });
    revalidatePath("/super-admin/clinicas");
    return { success: true, id: input.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar clínica.") };
  }
}

export async function upsertGlobalSetting(key: string, value: string): Promise<Result> {
  try {
    await requirePermission("superadmin.access");
    const existing = await prisma.setting.findFirst({
      where: { clinicId: null, key },
    });
    if (existing) {
      await prisma.setting.update({ where: { id: existing.id }, data: { value } });
    } else {
      await prisma.setting.create({ data: { clinicId: null, key, value } });
    }
    revalidatePath("/super-admin/configuracoes");
    return { success: true, id: key };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao salvar configuração global.") };
  }
}

type ResultVoid = { success: true } | { success: false; error: string };

export async function upsertGlobalSettingVoid(key: string, value: string): Promise<ResultVoid> {
  const r = await upsertGlobalSetting(key, value);
  return r.success ? { success: true } : r;
}
