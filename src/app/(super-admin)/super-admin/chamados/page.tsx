import { listTicketsDashboard } from "@/actions/tickets";
import { ChamadosClient } from "@/components/dashboard/tickets/ChamadosClient";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Chamados SaaS" };

export default async function SuperAdminChamadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; card?: string; page?: string }>;
}) {
  const params = await searchParams;
  const [dashboard, users] = await Promise.all([
    listTicketsDashboard(
      { q: params.q, card: params.card, page: params.page ? parseInt(params.page, 10) : 1 },
      "SAAS"
    ),
    prisma.user.findMany({
      where: { role: "SUPER_ADMIN", status: "ACTIVE" },
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
      filters={{ q: params.q, card: params.card }}
      saasMode
    />
  );
}
