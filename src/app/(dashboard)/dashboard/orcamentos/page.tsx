import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { listCommercialDashboard, getCompaniesForQuoteSelect } from "@/actions/commercial";
import { OrcamentosClient } from "@/components/dashboard/commercial/OrcamentosClient";
import type { CommercialTab } from "@/lib/commercial";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const VALID_TABS: CommercialTab[] = ["solicitacoes", "orcamentos", "contatos", "historico"];

async function OrcamentosContent({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.role, "leads.manage")) redirect("/dashboard");

  const canManage = hasPermission(session.user.role, "leads.manage");
  const sp = await searchParams;
  const tab = VALID_TABS.includes(param(sp.tab) as CommercialTab)
    ? (param(sp.tab) as CommercialTab)
    : "solicitacoes";
  const page = Math.max(1, parseInt(param(sp.page) ?? "1", 10) || 1);

  const [data, companies] = await Promise.all([
    listCommercialDashboard({
      tab,
      page,
      q: param(sp.q),
      card: param(sp.card),
      status: param(sp.status),
      dateFrom: param(sp.dateFrom),
      dateTo: param(sp.dateTo),
      companyId: param(sp.companyId),
    }),
    getCompaniesForQuoteSelect(),
  ]);

  return (
    <OrcamentosClient
      initialItems={data.items}
      initialTotal={data.total}
      initialPage={data.page}
      pageSize={data.pageSize}
      statCounts={data.statCounts}
      canManage={canManage}
      companies={companies}
      activeTab={tab}
      filters={{
        q: param(sp.q),
        card: param(sp.card),
        status: param(sp.status),
        dateFrom: param(sp.dateFrom),
        dateTo: param(sp.dateTo),
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
