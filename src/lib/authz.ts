import { auth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/types/roles";

export type AuthSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
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

/** Filtro Prisma para usuários EMPRESA — escopo da própria empresa */
export function getCompanyFilter(session: AuthSession): { companyId?: string } {
  if (session.user.role === "EMPRESA" && session.user.companyId) {
    return { companyId: session.user.companyId };
  }
  return {};
}

export function isEmpresaUser(session: AuthSession): boolean {
  return session.user.role === "EMPRESA";
}

export async function assertReferralAccess(
  session: AuthSession,
  referralId: string
): Promise<{ companyId: string }> {
  const { prisma } = await import("@/lib/prisma");
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
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
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
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

/** Tabela/coluna ausente — migration ainda não aplicada no banco */
export function isPrismaSchemaError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  const code = (error as { code: string }).code;
  return code === "P2021" || code === "P2022" || code === "P2010";
}
