import { auth } from "@/lib/auth";
import { isEmpresaUser } from "@/lib/authz";
import { scopedWhere } from "@/lib/scoped-db";
import { prisma } from "@/lib/prisma";
import { listTicketsDashboard } from "@/actions/tickets";
import { ChamadosClient } from "@/components/dashboard/tickets/ChamadosClient";

export const metadata = { title: "Chamados" };

export default async function ChamadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; card?: string; id?: string; page?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const isEmpresa = session?.user ? isEmpresaUser(session as never) : false;
  const scope = session?.user ? scopedWhere({ user: session.user as never }) : {};

  const [dashboard, users] = await Promise.all([
    listTicketsDashboard(
      {
        q: params.q,
        status: params.status,
        priority: params.priority,
        card: params.card,
        page: params.page ? parseInt(params.page, 10) : 1,
      },
      isEmpresa ? "SAAS" : "CLINIC"
    ),
    isEmpresa
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: { ...scope, status: "ACTIVE", role: { not: "SUPER_ADMIN" } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
  ]);

  return (
    <ChamadosClient
      items={dashboard.items}
      total={dashboard.total}
      statCounts={dashboard.statCounts}
      users={users}
      filters={{ q: params.q, status: params.status, priority: params.priority, card: params.card }}
      isEmpresaPortal={isEmpresa}
    />
  );
}
