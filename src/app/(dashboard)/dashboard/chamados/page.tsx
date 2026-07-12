import { auth } from "@/lib/auth";
import { isEmpresaUser } from "@/lib/authz";
import { scopedWhere } from "@/lib/scoped-db";
import { prisma } from "@/lib/prisma";
import { listTicketsDashboard } from "@/actions/tickets";
import { ChamadosClient } from "@/components/dashboard/tickets/ChamadosClient";
import { EmpresaChamadosClient } from "@/components/dashboard/tickets/EmpresaChamadosClient";

export const metadata = { title: "Chamados" };

export default async function ChamadosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    card?: string;
    category?: string;
    assignedTo?: string;
    companyId?: string;
    id?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const isEmpresa = session?.user ? isEmpresaUser(session as never) : false;
  const scope = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [dashboard, users, companies] = await Promise.all([
    listTicketsDashboard(
      {
        q: params.q,
        status: params.status,
        priority: params.priority,
        card: params.card,
        category: params.category,
        assignedTo: params.assignedTo,
        companyId: params.companyId,
        page,
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
    isEmpresa
      ? Promise.resolve([])
      : prisma.company.findMany({
          where: { ...scope, status: "ATIVA" },
          select: { id: true, tradeName: true, legalName: true },
          orderBy: { legalName: "asc" },
          take: 400,
        }),
  ]);

  if (isEmpresa) {
    return (
      <EmpresaChamadosClient
        items={dashboard.items}
        total={dashboard.total}
        page={dashboard.page}
        pageSize={dashboard.pageSize}
        statCounts={dashboard.statCounts}
        filters={{
          q: params.q,
          status: params.status,
          priority: params.priority,
          card: params.card,
          category: params.category,
        }}
      />
    );
  }

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
    />
  );
}
