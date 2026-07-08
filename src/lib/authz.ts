import { auth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/types/roles";
import { getTenantScope, mergeTenantWhere, type TenantScope } from "@/lib/tenant";
import { isCompanyHr } from "@/lib/tenant";

export type AuthSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    clinicId?: string | null;
    companyId?: string | null;
  };
};

export async function requireSession(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session as AuthSession;
}

export async function requirePermission(permission: Permission): Promise<AuthSession> {
  const session = await requireSession();
  if (!hasPermission(session.user.role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

/** @deprecated Use getTenantScope */
export function getCompanyFilter(session: AuthSession): { companyId?: string; clinicId?: string } {
  return getTenantScope(session);
}

export function isEmpresaUser(session: AuthSession): boolean {
  return isCompanyHr(session.user.role);
}

export function getScopedWhere(session: AuthSession, base: Record<string, unknown> = {}) {
  return mergeTenantWhere(base, getTenantScope(session));
}

export async function assertReferralAccess(
  session: AuthSession,
  referralId: string
): Promise<{ companyId: string }> {
  const { prisma } = await import("@/lib/prisma");
  const scope = getTenantScope(session);
  const referral = await prisma.referral.findFirst({
    where: { id: referralId, ...(scope.clinicId ? { clinicId: scope.clinicId } : {}) },
    select: { companyId: true },
  });
  if (!referral) throw new Error("NOT_FOUND");
  if (isEmpresaUser(session) && session.user.companyId !== referral.companyId) {
    throw new Error("FORBIDDEN");
  }
  return referral;
}

export async function assertPatientAccess(
  session: AuthSession,
  patientId: string
): Promise<{ companyId: string | null }> {
  const { prisma } = await import("@/lib/prisma");
  const scope = getTenantScope(session);
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, ...(scope.clinicId ? { clinicId: scope.clinicId } : {}) },
    select: { companyId: true },
  });
  if (!patient) throw new Error("NOT_FOUND");
  if (
    isEmpresaUser(session) &&
    session.user.companyId &&
    patient.companyId !== session.user.companyId
  ) {
    throw new Error("FORBIDDEN");
  }
  return patient;
}

export async function assertCompanyAccess(
  session: AuthSession,
  companyId: string
): Promise<void> {
  if (isEmpresaUser(session) && session.user.companyId !== companyId) {
    throw new Error("FORBIDDEN");
  }
  const scope = getTenantScope(session);
  if (scope.clinicId) {
    const { prisma } = await import("@/lib/prisma");
    const company = await prisma.company.findFirst({
      where: { id: companyId, clinicId: scope.clinicId },
      select: { id: true },
    });
    if (!company) throw new Error("FORBIDDEN");
  }
}

export function actionError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return "Sessão expirada. Faça login novamente.";
    if (error.message === "FORBIDDEN") return "Você não tem permissão para esta ação.";
    if (error.message === "NOT_FOUND") return "Registro não encontrado.";
  }
  return fallback;
}

export function isPrismaUniqueError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

export function isPrismaSchemaError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  const code = (error as { code: string }).code;
  return code === "P2021" || code === "P2022" || code === "P2010";
}

export type { TenantScope };
