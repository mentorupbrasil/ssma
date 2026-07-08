import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { requirePagePermission } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";
import { loadPreReferralsPageData } from "@/actions/pre-referrals";
import { PreEncaminhamentosClient } from "@/components/dashboard/pre-referrals/PreEncaminhamentosClient";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function PreEncaminhamentosData({ searchParams }: { searchParams: SearchParams }) {
  const session = await requirePagePermission("referrals.manage");
  if (isEmpresaUser(session)) notFound();

  const params = await searchParams;
  const filters = {
    q: getParam(params, "q") || undefined,
    status: getParam(params, "status") || undefined,
    queue: getParam(params, "queue") || undefined,
    dateFrom: getParam(params, "dateFrom") || undefined,
    dateTo: getParam(params, "dateTo") || undefined,
    clinicalExamType: getParam(params, "clinicalExamType") || undefined,
    source: getParam(params, "source") || undefined,
    page: Math.max(1, parseInt(getParam(params, "page") || "1", 10) || 1),
  };

  const result = await loadPreReferralsPageData(filters);

  if (!result.success) {
    return (
      <PreEncaminhamentosClient
        items={[]}
        total={0}
        page={1}
        pageSize={20}
        statusCounts={{}}
        dbReady={true}
        loadError={result.error}
        filters={filters}
      />
    );
  }

  return (
    <PreEncaminhamentosClient
      items={result.items}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      statusCounts={result.statusCounts}
      dbReady={result.dbReady}
      filters={filters}
    />
  );
}

export default function PreEncaminhamentosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
        </div>
      }
    >
      <PreEncaminhamentosData searchParams={searchParams} />
    </Suspense>
  );
}
