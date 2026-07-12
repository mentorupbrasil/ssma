import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_PERMISSIONS_SETTING_KEY,
  type RolePermissionMap,
} from "@/lib/permissions";

export async function loadRolePermissionOverrides(
  clinicId: string | null | undefined
): Promise<RolePermissionMap | null> {
  if (!clinicId) return null;
  const row = await prisma.setting.findUnique({
    where: { clinicId_key: { clinicId, key: ROLE_PERMISSIONS_SETTING_KEY } },
  });
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as RolePermissionMap;
  } catch {
    return null;
  }
}

export function mergeRolePermissions(
  overrides: RolePermissionMap | null | undefined
): RolePermissionMap {
  return {
    ...DEFAULT_ROLE_PERMISSIONS,
    ...(overrides ?? {}),
  };
}
