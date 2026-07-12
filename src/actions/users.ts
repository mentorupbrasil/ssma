"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { UserRole, UserStatus } from "@prisma/client";
import { requirePermission, actionError, isPrismaUniqueError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import {
  DEFAULT_ROLE_PERMISSIONS,
  MANAGEABLE_ROLES,
  ROLE_PERMISSIONS_SETTING_KEY,
  type Permission,
  type RolePermissionMap,
} from "@/lib/permissions";
import { loadRolePermissionOverrides } from "@/lib/role-permissions";

type Result = { success: true; id: string } | { success: false; error: string };

function revalidateUsers() {
  revalidatePath("/dashboard/usuarios");
}

export async function getRolePermissionsMatrix(): Promise<RolePermissionMap> {
  const session = await requirePermission("users.manage");
  const clinicId = await resolveClinicId(session);
  const overrides = await loadRolePermissionOverrides(clinicId);
  const matrix: RolePermissionMap = {};
  for (const role of MANAGEABLE_ROLES) {
    matrix[role] = overrides?.[role] ?? DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  }
  return matrix;
}

export async function saveRolePermissions(
  role: UserRole,
  permissions: Permission[]
): Promise<Result> {
  try {
    const session = await requirePermission("users.manage");
    if (!MANAGEABLE_ROLES.includes(role)) {
      return { success: false, error: "Perfil não editável." };
    }
    const clinicId = await resolveClinicId(session);
    if (!clinicId) return { success: false, error: "Clínica não encontrada." };

    const current = (await loadRolePermissionOverrides(clinicId)) ?? {};
    const next: RolePermissionMap = {
      ...current,
      [role]: permissions.filter((p) => p !== "superadmin.access"),
    };

    await prisma.setting.upsert({
      where: { clinicId_key: { clinicId, key: ROLE_PERMISSIONS_SETTING_KEY } },
      create: {
        clinicId,
        key: ROLE_PERMISSIONS_SETTING_KEY,
        value: JSON.stringify(next),
      },
      update: { value: JSON.stringify(next) },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "RolePermissions",
      entityId: role,
      details: permissions.join(","),
    });
    revalidateUsers();
    revalidatePath("/dashboard");
    return { success: true, id: role };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao salvar permissões.") };
  }
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyId?: string;
  status?: UserStatus;
}): Promise<Result> {
  try {
    const session = await requirePermission("users.manage");
    const clinicId = await resolveClinicId(session);
    if (!input.name?.trim() || !input.email?.trim()) {
      return { success: false, error: "Nome e e-mail são obrigatórios." };
    }
    if (!input.password || input.password.length < 6) {
      return { success: false, error: "Senha deve ter ao menos 6 caracteres." };
    }
    if (input.role === "COMPANY_HR" && !input.companyId) {
      return { success: false, error: "Usuário do Portal RH precisa de empresa vinculada." };
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: withClinicId(
        {
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          passwordHash,
          role: input.role,
          companyId: input.role === "COMPANY_HR" ? input.companyId || null : null,
          status: input.status ?? "ACTIVE",
        },
        clinicId
      ),
    });
    await createAuditLog({ action: "CREATE", entity: "User", entityId: user.id });
    revalidateUsers();
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
    if (input.companyId !== undefined) {
      data.companyId = input.companyId;
    } else if (input.role && input.role !== "COMPANY_HR") {
      data.companyId = null;
    }
    if (input.password) {
      if (input.password.length < 6) {
        return { success: false, error: "Senha deve ter ao menos 6 caracteres." };
      }
      data.passwordHash = await bcrypt.hash(input.password, 12);
    }
    if (input.role === "COMPANY_HR" && (input.companyId === null || input.companyId === "")) {
      return { success: false, error: "Usuário do Portal RH precisa de empresa vinculada." };
    }
    await prisma.user.updateMany({ where, data });
    await createAuditLog({ action: "UPDATE", entity: "User", entityId: input.id });
    revalidateUsers();
    return { success: true, id: input.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar usuário.") };
  }
}

export async function deactivateUser(id: string): Promise<Result> {
  return updateUser({ id, status: "INACTIVE" });
}

export async function activateUser(id: string): Promise<Result> {
  return updateUser({ id, status: "ACTIVE" });
}

export async function resetUserPassword(input: {
  id: string;
  password: string;
}): Promise<Result> {
  try {
    if (!input.password || input.password.length < 6) {
      return { success: false, error: "Senha deve ter ao menos 6 caracteres." };
    }
    return updateUser({ id: input.id, password: input.password });
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao redefinir senha.") };
  }
}
