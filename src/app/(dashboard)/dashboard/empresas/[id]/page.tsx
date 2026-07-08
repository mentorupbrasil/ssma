import { notFound } from "next/navigation";
import { getCompanyDetail } from "@/actions/companies";
import { CompanyDetailClient } from "@/components/dashboard/companies/CompanyDetailClient";
import { canEditCompanyCommercial } from "@/lib/companies";
import { requireAuthSession } from "@/lib/page-auth";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

async function EmpresaDetailData({ id }: { id: string }) {
  const session = await requireAuthSession();
  const result = await getCompanyDetail(id);

  if (!result.success) {
    notFound();
  }

  const canManage =
    session.user.role !== "VISUALIZADOR" && session.user.role !== "MEDICO";
  const canCommercial = canEditCompanyCommercial(session.user.role);

  return (
    <CompanyDetailClient
      company={result.company}
      canManage={canManage}
      canCommercial={canCommercial}
    />
  );
}

export default async function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
        </div>
      }
    >
      <EmpresaDetailData id={id} />
    </Suspense>
  );
}
