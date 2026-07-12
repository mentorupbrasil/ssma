import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  listCommercialDashboard,
  getCompaniesForQuoteSelect,
  listOpportunitiesForSelect,
} from "@/actions/commercial";
import { OrcamentosClient } from "@/components/dashboard/commercial/OrcamentosClient";
import { resolveCommercialTab, type CommercialTab } from "@/lib/commercial";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function OrcamentosContent({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.role, "leads.manage")) redirect("/dashboard");

  const canManage = hasPermission(session.user.role, "leads.manage");
  const sp = await searchParams;
  const tab = resolveCommercialTab(param(sp.tab)) as CommercialTab;
  const page = Math.max(1, parseInt(param(sp.page) ?? "1", 10) || 1);
  const bucketParam = param(sp.bucket) as "atrasados" | "hoje" | "proximos" | "all" | undefined;
  const followUpBucket =
    tab === "followups" ? bucketParam ?? "atrasados" : bucketParam;

  const filterInput = {
    tab,
    page,
    pageSize: param(sp.pageSize) ? parseInt(param(sp.pageSize)!, 10) : undefined,
    q: param(sp.q),
    card: param(sp.card),
    status: param(sp.status),
    stage: param(sp.stage),
    dateFrom: param(sp.dateFrom),
    dateTo: param(sp.dateTo),
    companyId: param(sp.companyId),
    origem: param(sp.origem),
    assignedTo: param(sp.assignedTo),
    service: param(sp.service),
    retorno: param(sp.retorno),
    followUpBucket,
  };

  const [data, companies, opportunities, assignees] = await Promise.all([
    listCommercialDashboard(filterInput),
    getCompaniesForQuoteSelect(),
    listOpportunitiesForSelect(),
    prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: { in: ["ADMIN", "CLINIC_ADMIN", "COMMERCIAL", "RECEPTION", "RECEPCAO"] },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);

  return (
    <OrcamentosClient
      initialItems={data.items}
      initialTotal={data.total}
      initialPage={data.page}
      pageSize={data.pageSize}
      statCounts={data.statCounts}
      followUpBuckets={
        "followUpBuckets" in data && data.followUpBuckets
          ? data.followUpBuckets
          : { atrasados: 0, hoje: 0, proximos: 0 }
      }
      canManage={canManage}
      companies={companies}
      opportunities={opportunities}
      assignees={assignees}
      activeTab={tab}
      filters={{
        q: param(sp.q),
        card: param(sp.card),
        status: param(sp.status),
        stage: param(sp.stage),
        dateFrom: param(sp.dateFrom),
        dateTo: param(sp.dateTo),
        companyId: param(sp.companyId),
        origem: param(sp.origem),
        assignedTo: param(sp.assignedTo),
        service: param(sp.service),
        retorno: param(sp.retorno),
        bucket: param(sp.bucket) ?? (tab === "followups" ? "atrasados" : undefined),
        pageSize: param(sp.pageSize),
      }}
    />
  );
}

export default function OrcamentosPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A085]" />
        </div>
      }
    >
      <OrcamentosContent searchParams={searchParams} />
    </Suspense>
  );
}
