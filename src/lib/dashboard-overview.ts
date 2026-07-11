import { prisma } from "@/lib/prisma";
import type { AuthSession } from "@/lib/authz";
import { getTenantScope } from "@/lib/tenant";
import { isCompanyHr } from "@/lib/tenant";
import { countPendingDocuments } from "@/actions/documents";
import { countPendingQuotes } from "@/actions/commercial";
import { addDays } from "date-fns";

export type DashboardOverview = {
  stats: {
    key: string;
    title: string;
    value: number;
    href: string;
    show: boolean;
  }[];
  pendingActions: {
    id: string;
    title: string;
    subtitle: string;
    href: string;
    type: string;
  }[];
  recentPreReferrals: {
    id: string;
    protocol: string;
    companyName: string;
    employeeName: string;
    status: string;
    createdAt: Date;
  }[];
  pendingDocuments: {
    id: string;
    title: string;
    companyName: string | null;
    status: string;
  }[];
  negotiatingQuotes: {
    id: string;
    quoteNumber: string;
    companyName: string;
    status: string;
  }[];
  recentReferrals?: {
    id: string;
    protocol: string;
    patientName: string;
    status: string;
    createdAt: Date;
  }[];
  upcomingAppointments?: {
    id: string;
    patientName: string;
    scheduledAt: Date;
    status: string;
  }[];
  availableDocuments?: {
    id: string;
    title: string;
    patientName: string | null;
    updatedAt: Date;
  }[];
  periodicDueCollaborators?: {
    id: string;
    name: string;
    nextPeriodicDate: Date | null;
  }[];
};

export async function getDashboardOverview(session: AuthSession): Promise<DashboardOverview> {
  const scope = getTenantScope(session);
  const isEmpresa = isCompanyHr(session.user.role);
  const clinicWhere = scope.clinicId ? { clinicId: scope.clinicId } : {};
  const companyWhere = scope.companyId ? { companyId: scope.companyId } : {};
  const baseWhere = { ...clinicWhere, ...companyWhere };

  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodicDueDate = addDays(now, 30);

  const [
    newPreReferrals,
    pendingDocs,
    docsExpiring,
    pendingQuotes,
    openReferrals,
    docsReleasedMonth,
    companiesWithPending,
    recentPreReferrals,
    pendingDocList,
    negotiatingQuotes,
    openClosings,
    overduePayments,
    openTickets,
    tasksToday,
    activeCollaborators,
    periodicDueCount,
    appointmentsToday,
    docsAvailable,
    openSaasTickets,
    recentReferrals,
    upcomingAppointments,
    availableDocuments,
    periodicDueCollaborators,
  ] = await Promise.all([
    !isEmpresa
      ? prisma.publicReferralRequest.count({
          where: {
            ...clinicWhere,
            status: { in: ["NOVO", "EM_ANALISE", "AGUARDANDO_RETORNO"] },
          },
        })
      : Promise.resolve(0),
    countPendingDocuments(scope.companyId),
    prisma.document.count({
      where: {
        ...baseWhere,
        validUntil: { gte: now, lte: in30Days },
        status: { notIn: ["ARQUIVADO", "CANCELADO", "VENCIDO"] },
      },
    }),
    !isEmpresa ? countPendingQuotes() : Promise.resolve(0),
    prisma.referral.count({
      where: {
        ...baseWhere,
        status: { in: ["NOVO", "EM_ANALISE", "AGUARDANDO_DOCUMENTO", "ASO_DISPONIVEL"] },
      },
    }),
    prisma.document.count({
      where: {
        ...baseWhere,
        availableOnPortal: true,
        updatedAt: { gte: monthStart },
      },
    }),
    !isEmpresa
      ? prisma.company.count({
          where: {
            ...clinicWhere,
            status: "ATIVA",
            OR: [
              { documents: { some: { status: { in: ["PENDENTE", "EM_EMISSAO", "EM_ELABORACAO"] } } } },
              { documents: { some: { status: "VENCIDO" } } },
            ],
          },
        })
      : Promise.resolve(0),
    !isEmpresa
      ? prisma.publicReferralRequest.findMany({
          where: { ...clinicWhere },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            protocol: true,
            companyName: true,
            employeeName: true,
            status: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    prisma.document.findMany({
      where: {
        ...baseWhere,
        status: { in: ["PENDENTE", "EM_EMISSAO", "EM_ELABORACAO"] },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        company: { select: { tradeName: true, legalName: true } },
      },
    }),
    !isEmpresa
      ? prisma.quote.findMany({
          where: {
            ...clinicWhere,
            status: { in: ["ENVIADO", "AGUARDANDO_RESPOSTA", "EM_ANALISE"] },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            companyName: true,
          },
        })
      : Promise.resolve([]),
    !isEmpresa
      ? prisma.monthlyClosing.count({
          where: { ...clinicWhere, status: { in: ["RASCUNHO", "EM_REVISAO"] } },
        })
      : Promise.resolve(0),
    !isEmpresa
      ? prisma.financialEntry.count({
          where: {
            ...clinicWhere,
            type: "PAGAR",
            status: { in: ["PENDENTE", "ATRASADO", "PARCIAL"] },
            dueDate: { lt: now },
          },
        })
      : Promise.resolve(0),
    prisma.ticket.count({
      where: isEmpresa
        ? {
            scope: "SAAS",
            companyId: scope.companyId,
            status: { in: ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] },
          }
        : {
            ...clinicWhere,
            scope: "CLINIC",
            status: { in: ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] },
          },
    }),
    !isEmpresa
      ? prisma.task.count({
          where: {
            ...clinicWhere,
            status: { notIn: ["CONCLUIDA", "CANCELADA"] },
            dueDate: { gte: todayStart, lte: todayEnd },
          },
        })
      : Promise.resolve(0),
    isEmpresa
      ? prisma.patient.count({ where: { ...companyWhere, status: "ATIVO" } })
      : Promise.resolve(0),
    isEmpresa
      ? prisma.patient.count({
          where: {
            ...companyWhere,
            OR: [
              { nextPeriodicDate: { lte: periodicDueDate } },
              {
                referrals: {
                  some: {
                    clinicalExamType: "PERIODICO",
                    status: {
                      in: [
                        "NOVO",
                        "EM_ANALISE",
                        "AGUARDANDO_AGENDAMENTO",
                        "AGENDADO",
                        "EM_ATENDIMENTO",
                        "AGUARDANDO_RESULTADO",
                        "AGUARDANDO_DOCUMENTO",
                        "ASO_DISPONIVEL",
                      ],
                    },
                  },
                },
              },
            ],
          },
        })
      : Promise.resolve(0),
    isEmpresa
      ? prisma.appointment.count({
          where: {
            ...companyWhere,
            scheduledAt: { gte: todayStart, lte: todayEnd },
            status: { in: ["AGENDADO", "CONFIRMADO", "CONCLUIDO"] },
          },
        })
      : Promise.resolve(0),
    isEmpresa
      ? prisma.document.count({
          where: {
            ...companyWhere,
            status: "DISPONIVEL",
            availableOnPortal: true,
          },
        })
      : Promise.resolve(0),
    isEmpresa
      ? prisma.ticket.count({
          where: {
            scope: "SAAS",
            companyId: scope.companyId,
            status: { in: ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] },
          },
        })
      : Promise.resolve(0),
    isEmpresa
      ? prisma.referral.findMany({
          where: companyWhere,
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            protocol: true,
            status: true,
            createdAt: true,
            patient: { select: { fullName: true } },
          },
        })
      : Promise.resolve([]),
    isEmpresa
      ? prisma.appointment.findMany({
          where: {
            ...companyWhere,
            scheduledAt: { gte: now },
            status: { in: ["AGENDADO", "CONFIRMADO"] },
          },
          orderBy: { scheduledAt: "asc" },
          take: 5,
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            patient: { select: { fullName: true } },
          },
        })
      : Promise.resolve([]),
    isEmpresa
      ? prisma.document.findMany({
          where: {
            ...companyWhere,
            status: "DISPONIVEL",
            availableOnPortal: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            updatedAt: true,
            patient: { select: { fullName: true } },
          },
        })
      : Promise.resolve([]),
    isEmpresa
      ? prisma.patient.findMany({
          where: {
            ...companyWhere,
            OR: [
              { nextPeriodicDate: { lte: periodicDueDate } },
              { nextPeriodicDate: null },
            ],
            status: "ATIVO",
          },
          orderBy: { nextPeriodicDate: "asc" },
          take: 5,
          select: {
            id: true,
            fullName: true,
            nextPeriodicDate: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const stats = isEmpresa
    ? [
        {
          key: "collaborators_active",
          title: "Colaboradores ativos",
          value: activeCollaborators,
          href: "/dashboard/colaboradores?status=ATIVO",
          show: true,
        },
        {
          key: "referrals_open",
          title: "Solicitações em aberto",
          value: openReferrals,
          href: "/dashboard/encaminhamentos?tab=solicitacoes",
          show: true,
        },
        {
          key: "appointments_today",
          title: "Agendamentos hoje",
          value: appointmentsToday,
          href: "/dashboard/encaminhamentos?tab=agenda",
          show: true,
        },
        {
          key: "docs_available",
          title: "Documentos disponíveis",
          value: docsAvailable,
          href: "/dashboard/documentos?card=disponiveis",
          show: true,
        },
        {
          key: "periodic_due",
          title: "Periódicos a vencer",
          value: periodicDueCount,
          href: "/dashboard/colaboradores?status=PERIODIC_DUE",
          show: true,
        },
        {
          key: "tickets_open",
          title: "Chamados abertos",
          value: openSaasTickets,
          href: "/dashboard/chamados",
          show: true,
        },
      ]
    : [
        {
          key: "pre_referrals",
          title: "Pré-encaminhamentos novos",
          value: newPreReferrals,
          href: "/dashboard/pre-encaminhamentos?queue=active",
          show: true,
        },
        {
          key: "pending_docs",
          title: "Documentos pendentes",
          value: pendingDocs,
          href: "/dashboard/documentos?card=PENDENTE",
          show: true,
        },
        {
          key: "docs_expiring",
          title: "Documentos vencendo",
          value: docsExpiring,
          href: "/dashboard/documentos?validity=a_vencer",
          show: true,
        },
        {
          key: "pending_quotes",
          title: "Orçamentos aguardando",
          value: pendingQuotes,
          href: "/dashboard/orcamentos?tab=orcamentos&status=AGUARDANDO_RESPOSTA",
          show: true,
        },
        {
          key: "closings_open",
          title: "Fechamentos em aberto",
          value: openClosings,
          href: "/dashboard/fechamento-mensal",
          show: true,
        },
        {
          key: "payments_overdue",
          title: "Pagamentos em atraso",
          value: overduePayments,
          href: "/dashboard/financeiro",
          show: true,
        },
        {
          key: "tickets_open",
          title: "Chamados abertos",
          value: openTickets,
          href: "/dashboard/chamados",
          show: true,
        },
        {
          key: "tasks_today",
          title: "Tarefas de hoje",
          value: tasksToday,
          href: "/dashboard/tarefas",
          show: true,
        },
        {
          key: "companies_pending",
          title: "Empresas com pendências",
          value: companiesWithPending,
          href: "/dashboard/empresas?status=DOCS_PENDING",
          show: true,
        },
        {
          key: "docs_released",
          title: "Docs liberados no mês",
          value: docsReleasedMonth,
          href: "/dashboard/documentos?card=disponiveis",
          show: true,
        },
      ].filter((s) => s.show);

  const pendingActions = isEmpresa
    ? [
        ...periodicDueCollaborators
          .filter((p) => p.nextPeriodicDate)
          .map((p) => ({
            id: p.id,
            title: p.fullName,
            subtitle: `Periódico previsto para ${p.nextPeriodicDate?.toLocaleDateString("pt-BR")}`,
            href: `/dashboard/colaboradores`,
            type: "periodico",
          })),
        ...availableDocuments.slice(0, 3).map((d) => ({
          id: d.id,
          title: d.title,
          subtitle: d.patient?.fullName
            ? `Colaborador: ${d.patient.fullName}`
            : "Documento disponível no portal",
          href: "/dashboard/documentos?card=disponiveis",
          type: "documento",
        })),
      ].slice(0, 8)
    : [
        ...pendingDocList.map((d) => ({
          id: d.id,
          title: d.title,
          subtitle: d.company?.tradeName ?? d.company?.legalName ?? "Sem empresa",
          href: `/dashboard/documentos`,
          type: "documento",
        })),
        ...recentPreReferrals
          .filter((p) => p.status === "NOVO")
          .map((p) => ({
            id: p.id,
            title: `Pré-encaminhamento ${p.protocol}`,
            subtitle: `${p.employeeName} — ${p.companyName}`,
            href: `/dashboard/pre-encaminhamentos/${p.id}`,
            type: "pre-encaminhamento",
          })),
      ].slice(0, 8);

  return {
    stats,
    pendingActions,
    recentPreReferrals,
    pendingDocuments: pendingDocList.map((d) => ({
      id: d.id,
      title: d.title,
      companyName: d.company?.tradeName ?? d.company?.legalName ?? null,
      status: d.status,
    })),
    negotiatingQuotes: negotiatingQuotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      companyName: q.companyName,
      status: q.status,
    })),
    recentReferrals: isEmpresa
      ? recentReferrals.map((r) => ({
          id: r.id,
          protocol: r.protocol,
          patientName: r.patient.fullName,
          status: r.status,
          createdAt: r.createdAt,
        }))
      : undefined,
    upcomingAppointments: isEmpresa
      ? upcomingAppointments.map((a) => ({
          id: a.id,
          patientName: a.patient?.fullName ?? "Sem colaborador",
          scheduledAt: a.scheduledAt,
          status: a.status,
        }))
      : undefined,
    availableDocuments: isEmpresa
      ? availableDocuments.map((d) => ({
          id: d.id,
          title: d.title,
          patientName: d.patient?.fullName ?? null,
          updatedAt: d.updatedAt,
        }))
      : undefined,
    periodicDueCollaborators: isEmpresa
      ? periodicDueCollaborators.map((p) => ({
          id: p.id,
          name: p.fullName,
          nextPeriodicDate: p.nextPeriodicDate,
        }))
      : undefined,
  };
}
