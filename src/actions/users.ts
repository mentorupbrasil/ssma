"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { UserRole, UserStatus } from "@prisma/client";
import { requirePermission, actionError, isPrismaUniqueError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";

type Result = { success: true; id: string } | { success: false; error: string };

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyId?: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("users.manage");
    const clinicId = await resolveClinicId(session);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: withClinicId(
        {
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          passwordHash,
          role: input.role,
          companyId: input.companyId || null,
          status: "ACTIVE",
        },
        clinicId
      ),
    });
    await createAuditLog({ action: "CREATE", entity: "User", entityId: user.id });
    revalidatePath("/dashboard/usuarios");
    return { success: true, id: user.id };
  } catch (e) {
    if (isPrismaUniqueError(e)) return { success: false, error: "E-mail já cadastrado." };
    return { success: false, error: actionError(e, "Erro ao criar usuário.") };
  }
}

export async function updateUser(input: {
  id: string;
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  companyId?: string | null;
  password?: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("users.manage");
    const where = scopedWhere(session, { id: input.id });
    const data: Record<string, unknown> = {};
    if (input.name) data.name = input.name.trim();
    if (input.role) data.role = input.role;
    if (input.status) data.status = input.status;
    if (input.companyId !== undefined) data.companyId = input.companyId;
    if (input.password) data.passwordHash = await bcrypt.hash(input.password, 12);
    await prisma.user.updateMany({ where, data });
    await createAuditLog({ action: "UPDATE", entity: "User", entityId: input.id });
    revalidatePath("/dashboard/usuarios");
    return { success: true, id: input.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar usuário.") };
  }
}

export async function deactivateUser(id: string): Promise<Result> {
  return updateUser({ id, status: "INACTIVE" });
}
