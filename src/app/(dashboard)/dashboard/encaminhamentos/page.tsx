import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuthSession } from "@/lib/page-auth";
import { getCompanyFilter, isEmpresaUser } from "@/lib/authz";
import {
  buildReferralWhere,
  REFERRAL_KPI_CARDS,
  type ReferralListItem,
} from "@/lib/referrals";
import { applyEmpresaReferralStatusFilter } from "@/lib/empresa-portal";
import { EncaminhamentosClient } from "@/components/dashboard/referrals/EncaminhamentosClient";
import { ExamesOperacaoEmpresaClient } from "@/components/dashboard/referrals/ExamesOperacaoEmpresaClient";
import { formatCPF } from "@/lib/helpers";
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

  const statusParam = getParam(params, "status") || undefined;

  const filters = {
    q: getParam(params, "q") || undefined,
    status: isEmpresa ? statusParam : statusParam || undefined,
    companyId: getParam(params, "companyId") || undefined,
    clinicalExamType: getParam(params, "clinicalExamType") || undefined,
    dateFrom: getParam(params, "dateFrom") || undefined,
    dateTo: getParam(params, "dateTo") || undefined,
    assignedToId: getParam(params, "assignedToId") || undefined,
    scheduledFrom: getParam(params, "scheduledFrom") || undefined,
    scheduledTo: getParam(params, "scheduledTo") || undefined,
    pending: getParam(params, "pending") || undefined,
    documentSituation: getParam(params, "documentSituation") || undefined,
  };

  const page = Math.max(1, parseInt(getParam(params, "page") || "1", 10) || 1);
  let where = buildReferralWhere(
    isEmpresa && statusParam ? { ...filters, status: undefined } : filters,
    companyScope
  );

  if (isEmpresa && statusParam) {
    where = applyEmpresaReferralStatusFilter(where, statusParam);
  }
  const skip = (page - 1) * REFERRAL_PAGE_SIZE;

  const baseWhere = companyScope ? { companyId: companyScope } : {};

  const countResultsPromise = isEmpresa
    ? Promise.resolve([])
    : Promise.all(
        REFERRAL_KPI_CARDS.map(async (card) => ({
          key: card.key,
          count: await prisma.referral.count({
            where: {
              ...baseWhere,
              status:
                card.statuses.length === 1
                  ? card.statuses[0]
                  : { in: card.statuses },
            },
          }),
        }))
      );

  const [total, referrals, countResults, companies, responsibles] = await Promise.all([
    prisma.referral.count({ where }),
    prisma.referral.findMany({
      where,
      include: { company: true, patient: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: REFERRAL_PAGE_SIZE,
    }),
    countResultsPromise,
    isEmpresa
      ? Promise.resolve([])
      : prisma.company.findMany({
          select: { id: true, legalName: true, tradeName: true },
          orderBy: { legalName: "asc" },
          take: 200,
        }),
    isEmpresa
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: {
            status: "ACTIVE",
            role: {
              in: [
                "CLINIC_ADMIN",
                "ADMIN",
                "RECEPTION",
                "RECEPCAO",
                "MEDICO",
                "HEALTH_PROFESSIONAL",
                "TECNICO",
                "SST_TECHNICIAN",
              ],
            },
            ...(session.user.clinicId ? { clinicId: session.user.clinicId } : {}),
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 100,
        }),
  ]);

  const statusCounts = Object.fromEntries(
    countResults.map((c) => [c.key, c.count])
  ) as Record<string, number>;

  const items: ReferralListItem[] = referrals.map((r) => ({
    id: r.id,
    protocol: r.protocol,
    companyId: r.companyId,
    companyName: r.company.tradeName ?? r.company.legalName,
    patientId: r.patientId,
    employeeName: r.patient.fullName,
    employeeCpf: formatCPF(r.patient.cpf),
    jobTitle: r.patient.jobTitle,
    department: r.patient.department,
    clinicalExamType: r.clinicalExamType,
    requestedDate: r.requestedDate.toISOString(),
    scheduledAt: r.scheduledAt?.toISOString() ?? null,
    status: r.status,
    responsibleName: r.assignedTo?.name ?? null,
    authorizerName: r.authorizerName,
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
    responsibles: responsibles.map((u) => ({
      id: u.id,
      name: u.name,
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
