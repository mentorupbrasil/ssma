import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scopedWhere } from "@/lib/scoped-db";
import { listTasksDashboard, syncTasksFromOperations } from "@/actions/tasks";
import { TarefasClient } from "@/components/dashboard/tasks/TarefasClient";

export const metadata = { title: "Tarefas" };

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    due?: string;
    origin?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const scope = session?.user ? scopedWhere({ user: session.user as never }) : {};

  if (session?.user) {
    try {
      await syncTasksFromOperations();
    } catch {
      // best-effort
    }
  }

  const [dashboard, users, companies] = await Promise.all([
    listTasksDashboard({
      q: params.q,
      status: params.status,
      priority: params.priority,
      assignedTo: params.assignedTo,
      due: params.due,
      origin: params.origin,
      page: params.page ? parseInt(params.page, 10) : 1,
    }),
    prisma.user.findMany({
      where: { ...scope, status: "ACTIVE", role: { not: "SUPER_ADMIN" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      where: { ...scope, status: "ATIVA" },
      select: { id: true, tradeName: true, legalName: true },
      orderBy: { legalName: "asc" },
      take: 300,
    }),
  ]);

  return (
    <TarefasClient
      items={dashboard.items}
      total={dashboard.total}
      users={users}
      companies={companies.map((c) => ({
        id: c.id,
        name: c.tradeName ?? c.legalName,
      }))}
      filters={{
        q: params.q,
        status: params.status,
        priority: params.priority,
        assignedTo: params.assignedTo,
        due: params.due,
        origin: params.origin,
      }}
    />
  );
}
