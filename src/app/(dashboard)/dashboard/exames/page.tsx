import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { isEmpresaUser } from "@/lib/authz";
import { listExamsForDashboard, getExamCategoryNavCounts } from "@/actions/exams";
import { resolveExamPageSize } from "@/lib/exams";
import { ExamesClient } from "@/components/dashboard/exams/ExamesClient";
import { EmpresaPreparosClient } from "@/components/dashboard/exams/EmpresaPreparosClient";
import { Loader2 } from "lucide-react";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function ExamesContent({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canView = hasPermission(session.user.role, "exams.view");
  if (!canView) redirect("/dashboard");

  const canManage = hasPermission(session.user.role, "exams.manage");
  const isEmpresa = isEmpresaUser(session);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(param(sp.page) ?? "1", 10) || 1);

  if (isEmpresa) {
    const data = await listExamsForDashboard({
      q: param(sp.q),
      card: param(sp.card),
      category: param(sp.category),
      preparationType: param(sp.preparationType),
      page,
    });

    return (
      <EmpresaPreparosClient
        initialItems={data.items}
        initialTotal={data.total}
        initialPage={data.page}
        pageSize={data.pageSize}
        filters={{
          q: param(sp.q),
          category: param(sp.category),
          preparationType: param(sp.preparationType),
          card: param(sp.card),
        }}
      />
    );
  }

  const q = param(sp.q)?.trim() || undefined;
  const category = param(sp.category);
  const status = param(sp.status);
  const pageSize = resolveExamPageSize(param(sp.pageSize));
  const listCategory = q ? undefined : category;

  const [data, categoryCounts] = await Promise.all([
    listExamsForDashboard({
      q,
      category: listCategory,
      status,
      sort: listCategory ? "name" : "category",
      page,
      pageSize,
    }),
    getExamCategoryNavCounts(status),
  ]);

  return (
    <ExamesClient
      initialItems={data.items}
      initialTotal={data.total}
      initialPage={data.page}
      pageSize={data.pageSize}
      canManage={canManage}
      categoryCounts={categoryCounts}
      filters={{
        q,
        category,
        status,
        pageSize: String(pageSize),
      }}
    />
  );
}

export default function ExamesDashboardPage({
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
      <ExamesContent searchParams={searchParams} />
    </Suspense>
  );
}
