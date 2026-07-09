import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { listTasksDashboard } from "@/actions/tasks";
import { TarefasClient } from "@/components/dashboard/tasks/TarefasClient";

export const metadata = { title: "Tarefas" };

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; card?: string; page?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const scope = session?.user ? scopedWhere({ user: session.user as never }) : {};

  const [dashboard, users, companies] = await Promise.all([
    listTasksDashboard({
      q: params.q,
      status: params.status,
      priority: params.priority,
      card: params.card,
      page: params.page ? parseInt(params.page, 10) : 1,
    }),
    prisma.user.findMany({
      where: { ...scope, status: "ACTIVE", role: { not: "SUPER_ADMIN" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      where: scope,
      select: { id: true, tradeName: true, legalName: true },
      orderBy: { legalName: "asc" },
      take: 200,
    }),
  ]);

  return (
    <TarefasClient
      items={dashboard.items}
      total={dashboard.total}
      statCounts={dashboard.statCounts}
      users={users}
      companies={companies.map((c) => ({ id: c.id, name: c.tradeName ?? c.legalName }))}
      filters={{ q: params.q, status: params.status, priority: params.priority, card: params.card }}
    />
  );
}
