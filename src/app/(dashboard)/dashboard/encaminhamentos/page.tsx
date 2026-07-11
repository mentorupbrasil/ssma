import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuthSession } from "@/lib/page-auth";
import { getCompanyFilter, isEmpresaUser } from "@/lib/authz";
import { buildReferralWhere, REFERRAL_STAT_CARDS, type ReferralListItem } from "@/lib/referrals";
import {
  referralStatCardsForEmpresa,
  empresaReferralCardByKey,
  applyEmpresaReferralStatusFilter,
} from "@/lib/empresa-portal";
import { EncaminhamentosClient } from "@/components/dashboard/referrals/EncaminhamentosClient";
import { ExamesOperacaoEmpresaClient } from "@/components/dashboard/referrals/ExamesOperacaoEmpresaClient";
import { Loader2 } from "lucide-react";

const REFERRAL_PAGE_SIZE = 20;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function loadReferralsForPage(
  session: Awaited<ReturnType<typeof requireAuthSession>>,
  params: Record<string, string | string[] | undefined>
) {
  const isEmpresa = isEmpresaUser(session);
  const companyScope = getCompanyFilter(session).companyId;

  const filters = {
    q: getParam(params, "q") || undefined,
    status: getParam(params, "status") || undefined,
    companyId: getParam(params, "companyId") || undefined,
    clinicalExamType: getParam(params, "clinicalExamType") || undefined,
    dateFrom: getParam(params, "dateFrom") || undefined,
    dateTo: getParam(params, "dateTo") || undefined,
  };

  const page = Math.max(1, parseInt(getParam(params, "page") || "1", 10) || 1);
  const empresaCard = isEmpresa ? empresaReferralCardByKey(filters.status) : undefined;
  const where = buildReferralWhere(
    empresaCard ? { ...filters, status: undefined } : filters,
    companyScope
  );
  const finalWhere = empresaCard ? applyEmpresaReferralStatusFilter(where, filters.status) : where;
  const skip = (page - 1) * REFERRAL_PAGE_SIZE;

  const statCards = isEmpresa ? referralStatCardsForEmpresa() : REFERRAL_STAT_CARDS;
  const baseWhere = companyScope ? { companyId: companyScope } : {};

  const [total, referrals, countResults, companies] = await Promise.all([
    prisma.referral.count({ where: finalWhere }),
    prisma.referral.findMany({
      where: finalWhere,
      include: { company: true, patient: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: REFERRAL_PAGE_SIZE,
    }),
    Promise.all(
      statCards.map(async (card) => {
        if (isEmpresa) {
          return {
            key: card.key,
            count: await prisma.referral.count({
              where: { ...baseWhere, status: { in: card.statuses } },
            }),
          };
        }
        return {
          key: card.status,
          count: await prisma.referral.count({ where: { ...baseWhere, status: card.status } }),
        };
      })
    ),
    isEmpresa
      ? Promise.resolve([])
      : prisma.company.findMany({
          select: { id: true, legalName: true, tradeName: true },
          orderBy: { legalName: "asc" },
          take: 200,
        }),
  ]);

  const statusCounts = Object.fromEntries(
    countResults.map((c) => [c.key, c.count])
  ) as Record<string, number>;

  const items: ReferralListItem[] = referrals.map((r) => ({
    id: r.id,
    protocol: r.protocol,
    companyName: r.company.tradeName ?? r.company.legalName,
    employeeName: r.patient.fullName,
    jobTitle: r.patient.jobTitle,
    clinicalExamType: r.clinicalExamType,
    requestedDate: r.requestedDate.toISOString(),
    scheduledAt: r.scheduledAt?.toISOString() ?? null,
    status: r.status,
    responsibleName: r.assignedTo?.name ?? null,
    companyPhone: r.companyPhone ?? r.company.phone,
    companyWhatsapp: r.company.whatsapp ?? r.company.phone,
  }));

  const canManage = !isEmpresa && session.user.role !== "VISUALIZADOR";

  return {
    initialItems: items,
    initialTotal: total,
    initialPage: page,
    pageSize: REFERRAL_PAGE_SIZE,
    statusCounts,
    companies: companies.map((c) => ({
      id: c.id,
      name: c.tradeName ?? c.legalName,
    })),
    isEmpresa,
    canManage,
    filters,
  };
}

async function EncaminhamentosData({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);

  if (isEmpresa) {
    if (getParam(params, "tab") === "agenda") {
      redirect("/dashboard/encaminhamentos");
    }

    const referrals = await loadReferralsForPage(session, params);
    return <ExamesOperacaoEmpresaClient referrals={referrals} />;
  }

  const referrals = await loadReferralsForPage(session, params);
  return <EncaminhamentosClient {...referrals} />;
}

export default function EncaminhamentosPage({
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
      <EncaminhamentosData searchParams={searchParams} />
    </Suspense>
  );
}
