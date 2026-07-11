import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getCompanyFilter, isEmpresaUser } from "@/lib/authz";
import {
  listDocumentsForDashboard,
  getDocumentFormOptions,
} from "@/actions/documents";
import { DocumentosClient } from "@/components/dashboard/documents/DocumentosClient";
import { Loader2 } from "lucide-react";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function DocumentosContent({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canView = hasPermission(session.user.role, "documents.manage");
  if (!canView) redirect("/dashboard");

  const companyFilter = getCompanyFilter(session);
  const isEmpresa = isEmpresaUser(session);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(param(sp.page) ?? "1", 10) || 1);

  const [data, formOptions] = await Promise.all([
    listDocumentsForDashboard(
      {
        q: param(sp.q),
        card: param(sp.card),
        type: param(sp.type),
        status: param(sp.status),
        companyId: param(sp.companyId),
        patientId: param(sp.patientId),
        referralId: param(sp.referralId),
        dateFrom: param(sp.dateFrom),
        dateTo: param(sp.dateTo),
        validity: param(sp.validity),
        sensitive: param(sp.sensitive),
        sort: param(sp.sort),
        page,
      },
      companyFilter.companyId
    ),
    getDocumentFormOptions(),
  ]);

  return (
    <DocumentosClient
      initialItems={data.items}
      initialTotal={data.total}
      initialPage={data.page}
      pageSize={data.pageSize}
      statCounts={data.statCounts}
      canManage={canView}
      formOptions={formOptions}
      filters={{
        q: param(sp.q),
        card: param(sp.card),
        type: param(sp.type),
        status: param(sp.status),
        companyId: param(sp.companyId),
        patientId: param(sp.patientId),
        referralId: param(sp.referralId),
        dateFrom: param(sp.dateFrom),
        dateTo: param(sp.dateTo),
        validity: param(sp.validity),
        sensitive: param(sp.sensitive),
        sort: param(sp.sort),
      }}
      isEmpresaPortal={isEmpresa}
    />
  );
}

export default function DocumentosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A085]" />
        </div>
      }
    >
      <DocumentosContent searchParams={searchParams} />
    </Suspense>
  );
}
