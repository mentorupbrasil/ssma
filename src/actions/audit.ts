"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, actionError } from "@/lib/authz";
import { scopedWhere } from "@/lib/scoped-db";
import {
  auditLogsToCsv,
  buildAuditWhere,
  formatAuditSummary,
  type AuditFilters,
} from "@/lib/audit";

export async function exportAuditLogsCsv(
  filters: AuditFilters = {}
): Promise<{ success: true; csv: string; count: number } | { success: false; error: string }> {
  try {
    const session = await requirePermission("audit.view");
    const scope = scopedWhere(session, {});
    const where = { ...scope, ...buildAuditWhere(filters) };
    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const rows = logs.map((log) => {
      const userName = log.user?.name ?? null;
      return {
        createdAt: log.createdAt.toISOString(),
        userName,
        action: log.action,
        entity: log.entity,
        details: log.details,
        ipAddress: log.ipAddress,
        summary: formatAuditSummary({
          action: log.action,
          entity: log.entity,
          details: log.details,
          userName,
        }),
      };
    });

    return {
      success: true,
      csv: auditLogsToCsv(rows),
      count: rows.length,
    };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao exportar logs.") };
  }
}
