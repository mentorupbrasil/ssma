import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { buildAuditWhere, getAuditPageSize } from "@/lib/audit";
import { AuditoriaClient } from "@/components/dashboard/audit/AuditoriaClient";

export const metadata = { title: "Auditoria" };

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    entity?: string;
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const scope = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const pageSize = getAuditPageSize();
  const page = Math.max(1, params.page ? parseInt(params.page, 10) : 1);

  const filters = {
    q: params.q,
    entity: params.entity && params.entity !== "ALL" ? params.entity : undefined,
    action: params.action && params.action !== "ALL" ? params.action : undefined,
    userId: params.userId && params.userId !== "ALL" ? params.userId : undefined,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  const where = {
    ...scope,
    ...buildAuditWhere(filters),
  };

  const [logs, total, users] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
    prisma.user.findMany({
      where: scope,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);

  return (
    <AuditoriaClient
      logs={logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
        userName: log.user?.name ?? null,
      }))}
      total={total}
      page={page}
      pageSize={pageSize}
      users={users}
      filters={filters}
    />
  );
}
