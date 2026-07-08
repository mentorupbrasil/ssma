import type { UserRole } from "@/types/roles";

/** ID da clínica demo padrão (seed). */
export const DEFAULT_CLINIC_ID = "clinic_default_unimetra";
export const DEFAULT_CLINIC_SLUG = "unimetra";

/** Mapeia papéis legados para os novos papéis do produto. */
const LEGACY_ROLE_MAP: Partial<Record<UserRole, UserRole>> = {
  ADMIN: "CLINIC_ADMIN",
  RECEPCAO: "RECEPTION",
  MEDICO: "HEALTH_PROFESSIONAL",
  TECNICO: "SST_TECHNICIAN",
  FINANCEIRO: "FINANCIAL",
  EMPRESA: "COMPANY_HR",
  VISUALIZADOR: "READ_ONLY",
};

export function normalizeRole(role: UserRole): UserRole {
  return LEGACY_ROLE_MAP[role] ?? role;
}

export function isSuperAdmin(role: UserRole): boolean {
  return normalizeRole(role) === "SUPER_ADMIN";
}

export function isCompanyHr(role: UserRole): boolean {
  return normalizeRole(role) === "COMPANY_HR";
}

export function isClinicStaff(role: UserRole): boolean {
  const r = normalizeRole(role);
  return r !== "SUPER_ADMIN" && r !== "COMPANY_HR";
}

export type TenantScope = {
  clinicId?: string;
  companyId?: string;
};

export function getTenantScope(session: {
  user: { role: UserRole; clinicId?: string | null; companyId?: string | null };
}): TenantScope {
  const role = normalizeRole(session.user.role);

  if (role === "SUPER_ADMIN") {
    return {};
  }

  const scope: TenantScope = {};
  if (session.user.clinicId) {
    scope.clinicId = session.user.clinicId;
  }
  if (role === "COMPANY_HR" && session.user.companyId) {
    scope.companyId = session.user.companyId;
  }
  return scope;
}

export function mergeTenantWhere<T extends Record<string, unknown>>(
  base: T,
  scope: TenantScope
): T & TenantScope {
  const merged = { ...base } as T & TenantScope;
  if (scope.clinicId) merged.clinicId = scope.clinicId;
  if (scope.companyId) merged.companyId = scope.companyId;
  return merged;
}
