import { prisma } from "@/lib/prisma";
import type { AuthSession } from "@/lib/authz";
import { getTenantScope } from "@/lib/tenant";
import { isCompanyHr } from "@/lib/tenant";
import { countPendingDocuments } from "@/actions/documents";
import { countPendingQuotes } from "@/actions/commercial";

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
      where: {
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
  ]);

  const stats = [
    {
      key: "pre_referrals",
      title: "Pré-encaminhamentos novos",
      value: newPreReferrals,
      href: "/dashboard/pre-encaminhamentos?queue=active",
      show: !isEmpresa,
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
      show: !isEmpresa,
    },
    {
      key: "closings_open",
      title: "Fechamentos em aberto",
      value: openClosings,
      href: "/dashboard/fechamento-mensal",
      show: !isEmpresa,
    },
    {
      key: "payments_overdue",
      title: "Pagamentos em atraso",
      value: overduePayments,
      href: "/dashboard/financeiro",
      show: !isEmpresa,
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
      show: !isEmpresa,
    },
    {
      key: "companies_pending",
      title: "Empresas com pendências",
      value: companiesWithPending,
      href: "/dashboard/empresas?status=DOCS_PENDING",
      show: !isEmpresa,
    },
    {
      key: "docs_released",
      title: "Docs liberados no mês",
      value: docsReleasedMonth,
      href: "/dashboard/documentos?card=disponiveis",
      show: true,
    },
  ].filter((s) => s.show);

  const pendingActions = [
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
  };
}
