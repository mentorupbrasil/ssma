import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { listExamsForDashboard } from "@/actions/exams";
import { ExamesClient } from "@/components/dashboard/exams/ExamesClient";
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
  const sp = await searchParams;
  const page = Math.max(1, parseInt(param(sp.page) ?? "1", 10) || 1);

  const data = await listExamsForDashboard({
    q: param(sp.q),
    card: param(sp.card),
    category: param(sp.category),
    status: param(sp.status),
    preparationType: param(sp.preparationType),
    showOnWebsite: param(sp.showOnWebsite),
    requiresAppointment: param(sp.requiresAppointment),
    deadline: param(sp.deadline),
    sort: param(sp.sort),
    page,
  });

  return (
    <ExamesClient
      initialItems={data.items}
      initialTotal={data.total}
      initialPage={data.page}
      pageSize={data.pageSize}
      statCounts={data.statCounts}
      canManage={canManage}
      filters={{
        q: param(sp.q),
        card: param(sp.card),
        category: param(sp.category),
        status: param(sp.status),
        preparationType: param(sp.preparationType),
        showOnWebsite: param(sp.showOnWebsite),
        requiresAppointment: param(sp.requiresAppointment),
        deadline: param(sp.deadline),
        sort: param(sp.sort),
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
