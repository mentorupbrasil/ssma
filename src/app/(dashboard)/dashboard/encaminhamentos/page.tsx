import { Suspense } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import type { ReferralStatus, AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthSession } from "@/lib/page-auth";
import { getCompanyFilter, isEmpresaUser } from "@/lib/authz";
import { buildReferralWhere, REFERRAL_STAT_CARDS, type ReferralListItem } from "@/lib/referrals";
import {
  buildAppointmentWhere,
  APPOINTMENT_STAT_CARDS,
  appointmentIncludeList,
  serializeAppointmentListItem,
  type AppointmentViewMode,
} from "@/lib/appointments";
import {
  appointmentStatCardsForEmpresa,
  referralStatCardsForEmpresa,
  type EmpresaExamesTab,
} from "@/lib/empresa-portal";
import { EncaminhamentosClient } from "@/components/dashboard/referrals/EncaminhamentosClient";
import { ExamesOperacaoEmpresaClient } from "@/components/dashboard/referrals/ExamesOperacaoEmpresaClient";
import { Loader2 } from "lucide-react";

const REFERRAL_PAGE_SIZE = 20;
const AGENDA_PAGE_SIZE = 100;

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
  const where = buildReferralWhere(filters, companyScope);
  const skip = (page - 1) * REFERRAL_PAGE_SIZE;

  const statCards = isEmpresa ? referralStatCardsForEmpresa() : REFERRAL_STAT_CARDS;
  const statStatuses = statCards.map((c) => c.status);
  const baseWhere = companyScope ? { companyId: companyScope } : {};

  const [total, referrals, countResults, companies] = await Promise.all([
    prisma.referral.count({ where }),
    prisma.referral.findMany({
      where,
      include: { company: true, patient: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: REFERRAL_PAGE_SIZE,
    }),
    Promise.all(
      statStatuses.map(async (status) => ({
        status,
        count: await prisma.referral.count({ where: { ...baseWhere, status } }),
      }))
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
    countResults.map((c) => [c.status, c.count])
  ) as Partial<Record<ReferralStatus, number>>;

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

async function loadAgendaForPage(
  session: Awaited<ReturnType<typeof requireAuthSession>>,
  params: Record<string, string | string[] | undefined>
) {
  const isEmpresa = isEmpresaUser(session);
  const companyScope = getCompanyFilter(session).companyId;

  const filters = {
    q: getParam(params, "q") || undefined,
    status: getParam(params, "status") || undefined,
    companyId: getParam(params, "companyId") || undefined,
    patientId: getParam(params, "patientId") || undefined,
    clinicalExamType: getParam(params, "clinicalExamType") || undefined,
    professionalId: getParam(params, "professionalId") || undefined,
    roomName: getParam(params, "roomName") || undefined,
    date: getParam(params, "date") || format(new Date(), "yyyy-MM-dd"),
    dateFrom: getParam(params, "dateFrom") || undefined,
    dateTo: getParam(params, "dateTo") || undefined,
    view: (getParam(params, "view") || "week") as AppointmentViewMode,
  };

  const professionalScopeId =
    session.user.role === "MEDICO" ? session.user.id : undefined;

  const where = buildAppointmentWhere(filters, companyScope, professionalScopeId);

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const baseWhere = companyScope ? { companyId: companyScope } : {};

  const statCards = isEmpresa ? appointmentStatCardsForEmpresa() : APPOINTMENT_STAT_CARDS;

  const [total, appointments, countResults, companies, patients, professionals] =
    await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: appointmentIncludeList,
        orderBy: { scheduledAt: "asc" },
        take: AGENDA_PAGE_SIZE,
      }),
      Promise.all(
        statCards.map(async (card) => {
          if (card.status === "TODAY_AGENDADO") {
            return {
              key: card.key,
              count: await prisma.appointment.count({
                where: {
                  ...baseWhere,
                  status: "AGENDADO",
                  scheduledAt: { gte: todayStart, lte: todayEnd },
                  ...(professionalScopeId ? { professionalId: professionalScopeId } : {}),
                },
              }),
            };
          }
          return {
            key: card.key,
            count: await prisma.appointment.count({
              where: {
                ...baseWhere,
                status: card.status as AppointmentStatus,
                scheduledAt: { gte: todayStart, lte: todayEnd },
                ...(professionalScopeId ? { professionalId: professionalScopeId } : {}),
              },
            }),
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
      prisma.patient.findMany({
        where: companyScope ? { companyId: companyScope, status: "ATIVO" } : { status: "ATIVO" },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" },
        take: 300,
      }),
      prisma.user.findMany({
        where: { status: "ACTIVE", role: { in: ["MEDICO", "TECNICO", "ADMIN"] } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  const statusCounts = Object.fromEntries(countResults.map((c) => [c.key, c.count]));
  const items = appointments.map(serializeAppointmentListItem);

  const canManage =
    !isEmpresa &&
    session.user.role !== "VISUALIZADOR" &&
    session.user.role !== "FINANCEIRO";

  return {
    initialItems: items,
    initialTotal: total,
    statusCounts,
    companies: companies.map((c) => ({
      id: c.id,
      name: c.tradeName ?? c.legalName,
    })),
    patients: patients.map((p) => ({ id: p.id, name: p.fullName })),
    professionals,
    rooms: ["Sala 1", "Sala 2", "Sala 3", "Unidade Centro", "Unidade Norte"],
    canManage,
    userRole: session.user.role,
    isEmpresaPortal: isEmpresa,
    filters,
  };
}

async function EncaminhamentosData({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);

  if (isEmpresa) {
    const tabParam = getParam(params, "tab");
    const activeTab: EmpresaExamesTab = tabParam === "agenda" ? "agenda" : "solicitacoes";

    if (activeTab === "agenda") {
      const agenda = await loadAgendaForPage(session, params);
      return <ExamesOperacaoEmpresaClient activeTab="agenda" agenda={agenda} />;
    }

    const referrals = await loadReferralsForPage(session, params);
    return <ExamesOperacaoEmpresaClient activeTab="solicitacoes" referrals={referrals} />;
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
