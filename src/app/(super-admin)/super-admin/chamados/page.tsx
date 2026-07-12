import { listTicketsDashboard } from "@/actions/tickets";
import { ChamadosClient } from "@/components/dashboard/tickets/ChamadosClient";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Chamados SaaS" };

export default async function SuperAdminChamadosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    companyId?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const [dashboard, users, companies] = await Promise.all([
    listTicketsDashboard(
      {
        q: params.q,
        status: params.status,
        priority: params.priority,
        category: params.category,
        assignedTo: params.assignedTo,
        companyId: params.companyId,
        page: params.page ? parseInt(params.page, 10) : 1,
      },
      "SAAS"
    ),
    prisma.user.findMany({
      where: { role: "SUPER_ADMIN", status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      select: { id: true, tradeName: true, legalName: true },
      orderBy: { legalName: "asc" },
      take: 400,
    }),
  ]);

  return (
    <ChamadosClient
      items={dashboard.items}
      total={dashboard.total}
      page={dashboard.page}
      pageSize={dashboard.pageSize}
      users={users}
      companies={companies.map((c) => ({
        id: c.id,
        name: c.tradeName ?? c.legalName,
      }))}
      filters={{
        q: params.q,
        status: params.status,
        priority: params.priority,
        category: params.category,
        assignedTo: params.assignedTo,
        companyId: params.companyId,
      }}
      saasMode
    />
  );
}
