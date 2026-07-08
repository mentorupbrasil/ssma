import type { AuthSession } from "@/lib/authz";
import { DEFAULT_CLINIC_ID, getTenantScope, mergeTenantWhere } from "@/lib/tenant";

export function scopedWhere(session: AuthSession, base: Record<string, unknown> = {}) {
  return mergeTenantWhere(base, getTenantScope(session));
}

export async function resolveClinicId(session: AuthSession): Promise<string | null> {
  const scope = getTenantScope(session);
  if (scope.clinicId) return scope.clinicId;
  return DEFAULT_CLINIC_ID;
}

export async function resolvePublicClinicId(): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const active = await prisma.clinic.findFirst({
    where: { status: "ATIVA" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return active?.id ?? DEFAULT_CLINIC_ID;
}

export function withClinicId<T extends Record<string, unknown>>(
  data: T,
  clinicId: string | null
): T & { clinicId?: string } {
  if (!clinicId) return data;
  return { ...data, clinicId };
}
