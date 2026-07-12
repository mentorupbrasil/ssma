import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { prisma } from "@/lib/prisma";
import { listSstDraftsDashboard } from "@/actions/sst";
import { AssistenteSstClient } from "@/components/dashboard/sst/AssistenteSstClient";

export const metadata = { title: "Assistente SST" };

export default async function AssistenteSstPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    companyId?: string;
    page?: string;
    id?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const scope = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const tab = params.tab ?? "elaboracao";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [dashboard, companies, users] = await Promise.all([
    tab === "modelos"
      ? Promise.resolve({ items: [], total: 0, page: 1, pageSize: 25 })
      : listSstDraftsDashboard({
          tab,
          q: params.q,
          companyId: params.companyId,
          page,
        }),
    prisma.company.findMany({
      where: { ...scope, status: "ATIVA" },
      select: { id: true, tradeName: true, legalName: true },
      orderBy: { legalName: "asc" },
      take: 300,
    }),
    prisma.user.findMany({
      where: {
        ...scope,
        status: "ACTIVE",
        role: { in: ["CLINIC_ADMIN", "SST_TECHNICIAN", "HEALTH_PROFESSIONAL", "TECNICO", "MEDICO", "ADMIN"] },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return (
    <AssistenteSstClient
      items={dashboard.items}
      total={dashboard.total}
      page={dashboard.page}
      pageSize={dashboard.pageSize}
      companies={companies.map((c) => ({
        id: c.id,
        name: c.tradeName ?? c.legalName,
      }))}
      users={users}
      filters={{
        tab,
        q: params.q,
        companyId: params.companyId,
      }}
    />
  );
}
