import { Suspense } from "react";
import { redirect } from "next/navigation";
import { format, startOfDay, endOfDay } from "date-fns";
import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthSession } from "@/lib/page-auth";
import { getCompanyFilter, isEmpresaUser } from "@/lib/authz";
import {
  buildAppointmentWhere,
  APPOINTMENT_STAT_CARDS,
  appointmentIncludeList,
  serializeAppointmentListItem,
  type AppointmentViewMode,
} from "@/lib/appointments";
import { appointmentStatCardsForEmpresa } from "@/lib/empresa-portal";
import { AgendaClient } from "@/components/dashboard/appointments/AgendaClient";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 100;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildEmpresaAgendaRedirect(params: Record<string, string | string[] | undefined>) {
  const qs = new URLSearchParams();
  qs.set("tab", "agenda");
  for (const [key, value] of Object.entries(params)) {
    if (key === "tab") continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) qs.set(key, v);
  }
  return `/dashboard/encaminhamentos?${qs.toString()}`;
}

async function AgendaData({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);

  if (isEmpresa) {
    redirect(buildEmpresaAgendaRedirect(params));
  }

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
    view: (getParam(params, "view") || "day") as AppointmentViewMode,
  };

  const professionalScopeId =
    session.user.role === "MEDICO" ? session.user.id : undefined;

  const where = buildAppointmentWhere(filters, companyScope, professionalScopeId);

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const baseWhere = companyScope ? { companyId: companyScope } : {};

  const statCards = APPOINTMENT_STAT_CARDS;

  const [total, appointments, countResults, companies, patients, professionals] =
    await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: appointmentIncludeList,
        orderBy: { scheduledAt: "asc" },
        take: PAGE_SIZE,
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
      prisma.company.findMany({
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
    session.user.role !== "VISUALIZADOR" &&
    session.user.role !== "EMPRESA" &&
    session.user.role !== "FINANCEIRO";

  return (
    <AgendaClient
      initialItems={items}
      initialTotal={total}
      statusCounts={statusCounts}
      companies={companies.map((c) => ({
        id: c.id,
        name: c.tradeName ?? c.legalName,
      }))}
      patients={patients.map((p) => ({ id: p.id, name: p.fullName }))}
      professionals={professionals}
      rooms={["Sala 1", "Sala 2", "Sala 3", "Unidade Centro", "Unidade Norte"]}
      canManage={canManage}
      userRole={session.user.role}
      filters={filters}
    />
  );
}

export default function AgendaPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
        </div>
      }
    >
      <AgendaData searchParams={searchParams} />
    </Suspense>
  );
}
