import { prisma } from "@/lib/prisma";
import type { AuthSession } from "@/lib/authz";
import { getTenantScope, isCompanyHr } from "@/lib/tenant";
import { countPendingDocuments } from "@/actions/documents";
import { addDays } from "date-fns";
import {
  isCommercialModuleEnabled,
  isPathModuleEnabled,
  isTicketsModuleEnabled,
} from "@/lib/modules";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documents";
import { TICKET_STATUS_LABELS } from "@/lib/tickets";
import { REFERRAL_STATUS_LABELS } from "@/types";
import type { ReferralStatus } from "@prisma/client";

export type DashboardPriorityItem = {
  id: string;
  title: string;
  entityLabel: string;
  kind: string;
  status: string;
  statusType: "document" | "referral" | "ticket" | "company";
  href: string;
  urgency: number;
  actionLabel: "Resolver" | "Abrir";
};

export type DashboardActivityItem = {
  id: string;
  description: string;
  actor: string;
  at: Date;
  href?: string;
};

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
  priorityItems: DashboardPriorityItem[];
  recentActivities: DashboardActivityItem[];
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
    clinicalExamType: string;
    status: string;
    scheduledAt: Date | null;
    createdAt: Date;
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

function companyLabel(
  company: { tradeName: string | null; legalName: string } | null | undefined
) {
  if (!company) return "Sem empresa";
  return company.tradeName?.trim() || company.legalName;
}

export async function getDashboardOverview(session: AuthSession): Promise<DashboardOverview> {
  const scope = getTenantScope(session);
  const isEmpresa = isCompanyHr(session.user.role);
  const clinicWhere = scope.clinicId ? { clinicId: scope.clinicId } : {};
  const companyWhere = scope.companyId ? { companyId: scope.companyId } : {};
  const baseWhere = { ...clinicWhere, ...companyWhere };

  const now = new Date();
  const in30Days = addDays(now, 30);
  const periodicDueDate = addDays(now, 30);

  if (isEmpresa) {
    return getEmpresaOverview({
      companyWhere,
      baseWhere,
      now,
      in30Days,
      periodicDueDate,
    });
  }

  const [
    pendingDocs,
    docsExpiring,
    openReferrals,
    companiesWithPending,
    openTickets,
    waitingDocReferrals,
    pendingDocList,
    expiringDocList,
    pendingCompanyList,
    openTicketList,
    recentDocHistory,
    recentCompanies,
    recentPatients,
    recentReferralsCreated,
    recentTicketsUpdated,
    negotiatingQuotes,
  ] = await Promise.all([
    countPendingDocuments(scope.companyId),
    prisma.document.count({
      where: {
        ...clinicWhere,
        validUntil: { gte: now, lte: in30Days },
        status: { notIn: ["ARQUIVADO", "CANCELADO", "VENCIDO"] },
      },
    }),
    prisma.referral.count({
      where: {
        ...clinicWhere,
        status: { in: ["NOVO", "EM_ANALISE", "AGUARDANDO_DOCUMENTO", "ASO_DISPONIVEL"] },
      },
    }),
    prisma.company.count({
      where: {
        ...clinicWhere,
        status: "ATIVA",
        OR: [
          { documents: { some: { status: { in: ["PENDENTE", "EM_EMISSAO", "EM_ELABORACAO"] } } } },
          { documents: { some: { status: "VENCIDO" } } },
        ],
      },
    }),
    isTicketsModuleEnabled()
      ? prisma.ticket.count({
          where: {
            ...clinicWhere,
            scope: "CLINIC",
            status: { in: ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] },
          },
        })
      : Promise.resolve(0),
    prisma.referral.findMany({
      where: { ...clinicWhere, status: "AGUARDANDO_DOCUMENTO" },
      orderBy: { updatedAt: "asc" },
      take: 8,
      select: {
        id: true,
        protocol: true,
        status: true,
        company: { select: { tradeName: true, legalName: true } },
        patient: { select: { fullName: true } },
      },
    }),
    prisma.document.findMany({
      where: {
        ...clinicWhere,
        status: { in: ["PENDENTE", "EM_EMISSAO", "EM_ELABORACAO"] },
      },
      orderBy: { updatedAt: "asc" },
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        company: { select: { tradeName: true, legalName: true } },
        patient: { select: { fullName: true } },
      },
    }),
    prisma.document.findMany({
      where: {
        ...clinicWhere,
        validUntil: { gte: now, lte: in30Days },
        status: { notIn: ["ARQUIVADO", "CANCELADO", "VENCIDO"] },
      },
      orderBy: { validUntil: "asc" },
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        validUntil: true,
        company: { select: { tradeName: true, legalName: true } },
        patient: { select: { fullName: true } },
      },
    }),
    prisma.company.findMany({
      where: {
        ...clinicWhere,
        status: "ATIVA",
        OR: [
          { documents: { some: { status: { in: ["PENDENTE", "EM_EMISSAO", "EM_ELABORACAO"] } } } },
          { documents: { some: { status: "VENCIDO" } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        tradeName: true,
        legalName: true,
      },
    }),
    isTicketsModuleEnabled()
      ? prisma.ticket.findMany({
          where: {
            ...clinicWhere,
            scope: "CLINIC",
            status: { in: ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] },
          },
          orderBy: [{ priority: "desc" }, { updatedAt: "asc" }],
          take: 6,
          select: {
            id: true,
            protocol: true,
            subject: true,
            status: true,
            priority: true,
            company: { select: { tradeName: true, legalName: true } },
          },
        })
      : Promise.resolve([]),
    prisma.documentHistory.findMany({
      where: {
        action: { in: ["FILE_ATTACHED", "FILE_REPLACED", "PORTAL_ENABLED", "SENT"] },
        ...(scope.clinicId ? { document: { clinicId: scope.clinicId } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        action: true,
        createdAt: true,
        performedBy: { select: { name: true } },
        document: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.company.findMany({
      where: clinicWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        tradeName: true,
        legalName: true,
        createdAt: true,
      },
    }),
    prisma.patient.findMany({
      where: clinicWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        company: { select: { tradeName: true, legalName: true } },
      },
    }),
    prisma.referral.findMany({
      where: clinicWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        protocol: true,
        createdAt: true,
        patient: { select: { fullName: true } },
        company: { select: { tradeName: true, legalName: true } },
      },
    }),
    isTicketsModuleEnabled()
      ? prisma.ticket.findMany({
          where: { ...clinicWhere, scope: "CLINIC" },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            protocol: true,
            subject: true,
            updatedAt: true,
            assignedTo: { select: { name: true } },
            createdBy: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    isCommercialModuleEnabled()
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
  ]);

  const stats = [
    {
      key: "referrals_open",
      title: "Atendimentos em aberto",
      value: openReferrals,
      href: "/dashboard/encaminhamentos",
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
      key: "tickets_open",
      title: "Chamados abertos",
      value: openTickets,
      href: "/dashboard/chamados",
      show: isTicketsModuleEnabled(),
    },
    {
      key: "companies_pending",
      title: "Empresas com pendências",
      value: companiesWithPending,
      href: "/dashboard/empresas?status=DOCS_PENDING",
      show: true,
    },
  ]
    .filter((s) => s.show && isPathModuleEnabled(s.href))
    .slice(0, 5);

  const seen = new Set<string>();
  const priorityItems: DashboardPriorityItem[] = [];

  const pushPriority = (item: DashboardPriorityItem) => {
    const key = `${item.statusType}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    priorityItems.push(item);
  };

  for (const doc of expiringDocList) {
    const daysLeft = doc.validUntil
      ? Math.ceil((doc.validUntil.getTime() - now.getTime()) / 86400000)
      : 30;
    pushPriority({
      id: doc.id,
      title: doc.title,
      entityLabel:
        doc.patient?.fullName ?? companyLabel(doc.company),
      kind: "Documento próximo do vencimento",
      status: daysLeft <= 7 ? "Vence em breve" : "A vencer",
      statusType: "document",
      href: `/dashboard/documentos?id=${doc.id}`,
      urgency: daysLeft <= 7 ? 1 : 3,
      actionLabel: "Resolver",
    });
  }

  for (const doc of pendingDocList) {
    pushPriority({
      id: doc.id,
      title: doc.title,
      entityLabel: doc.patient?.fullName ?? companyLabel(doc.company),
      kind: "Documento obrigatório pendente",
      status: DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status,
      statusType: "document",
      href: `/dashboard/documentos?id=${doc.id}`,
      urgency: 2,
      actionLabel: "Resolver",
    });
  }

  for (const referral of waitingDocReferrals) {
    pushPriority({
      id: referral.id,
      title: referral.patient.fullName,
      entityLabel: companyLabel(referral.company),
      kind: "Atendimento aguardando documentos",
      status: REFERRAL_STATUS_LABELS[referral.status as ReferralStatus] ?? referral.status,
      statusType: "referral",
      href: `/dashboard/encaminhamentos?id=${referral.id}`,
      urgency: 2,
      actionLabel: "Resolver",
    });
  }

  for (const ticket of openTicketList) {
    const high = ticket.priority === "URGENTE" || ticket.priority === "ALTA";
    pushPriority({
      id: ticket.id,
      title: ticket.subject,
      entityLabel: companyLabel(ticket.company) || "Interno",
      kind: "Chamado aberto",
      status: TICKET_STATUS_LABELS[ticket.status] ?? ticket.status,
      statusType: "ticket",
      href: `/dashboard/chamados?id=${ticket.id}`,
      urgency: high ? 1 : 4,
      actionLabel: "Abrir",
    });
  }

  for (const company of pendingCompanyList) {
    pushPriority({
      id: company.id,
      title: companyLabel(company),
      entityLabel: "Pendências documentais",
      kind: "Empresa com pendência",
      status: "Pendências",
      statusType: "company",
      href: `/dashboard/empresas/${company.id}?tab=documents`,
      urgency: 5,
      actionLabel: "Abrir",
    });
  }

  priorityItems.sort((a, b) => a.urgency - b.urgency || a.title.localeCompare(b.title));

  const activities: DashboardActivityItem[] = [];

  for (const h of recentDocHistory) {
    const isRelease = h.action === "PORTAL_ENABLED" || h.action === "SENT";
    activities.push({
      id: `dochist-${h.id}`,
      description: isRelease
        ? `Documento liberado: ${h.document.title}`
        : `Documento anexado: ${h.document.title}`,
      actor: h.performedBy?.name ?? "Sistema",
      at: h.createdAt,
      href: `/dashboard/documentos?id=${h.document.id}`,
    });
  }

  for (const c of recentCompanies) {
    activities.push({
      id: `company-${c.id}`,
      description: `Empresa cadastrada: ${companyLabel(c)}`,
      actor: "Sistema",
      at: c.createdAt,
      href: `/dashboard/empresas/${c.id}`,
    });
  }

  for (const p of recentPatients) {
    activities.push({
      id: `patient-${p.id}`,
      description: `Colaborador cadastrado: ${p.fullName}`,
      actor: companyLabel(p.company),
      at: p.createdAt,
      href: `/dashboard/colaboradores/${p.id}`,
    });
  }

  for (const r of recentReferralsCreated) {
    activities.push({
      id: `referral-${r.id}`,
      description: `Atendimento criado: ${r.patient.fullName}`,
      actor: companyLabel(r.company),
      at: r.createdAt,
      href: `/dashboard/encaminhamentos?id=${r.id}`,
    });
  }

  for (const t of recentTicketsUpdated) {
    activities.push({
      id: `ticket-${t.id}`,
      description: `Chamado atualizado: ${t.subject}`,
      actor: t.assignedTo?.name ?? t.createdBy.name,
      at: t.updatedAt,
      href: `/dashboard/chamados?id=${t.id}`,
    });
  }

  activities.sort((a, b) => b.at.getTime() - a.at.getTime());
  const recentActivities = activities.slice(0, 10);

  const pendingActions = priorityItems.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.kind} · ${item.entityLabel}`,
    href: item.href,
    type: item.statusType,
  }));

  return {
    stats,
    pendingActions,
    priorityItems: priorityItems.slice(0, 12),
    recentActivities,
    recentPreReferrals: [],
    pendingDocuments: pendingDocList.map((d) => ({
      id: d.id,
      title: d.title,
      companyName: companyLabel(d.company),
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

async function getEmpresaOverview(input: {
  companyWhere: { companyId?: string };
  baseWhere: Record<string, unknown>;
  now: Date;
  in30Days: Date;
  periodicDueDate: Date;
}): Promise<DashboardOverview> {
  const { companyWhere, baseWhere, now, in30Days, periodicDueDate } = input;

  const [
    pendingDocs,
    docsExpiring,
    openReferrals,
    activeCollaborators,
    periodicDueCount,
    docsAvailable,
    openSaasTickets,
    recentReferrals,
    availableDocuments,
    periodicDueCollaborators,
    pendingDocList,
  ] = await Promise.all([
    countPendingDocuments(companyWhere.companyId),
    prisma.document.count({
      where: {
        ...baseWhere,
        validUntil: { gte: now, lte: in30Days },
        status: { notIn: ["ARQUIVADO", "CANCELADO", "VENCIDO"] },
      },
    }),
    prisma.referral.count({
      where: {
        ...baseWhere,
        status: { in: ["NOVO", "EM_ANALISE", "AGUARDANDO_DOCUMENTO", "ASO_DISPONIVEL"] },
      },
    }),
    prisma.patient.count({ where: { ...companyWhere, status: "ATIVO" } }),
    prisma.patient.count({
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
    }),
    prisma.document.count({
      where: {
        ...companyWhere,
        fileUrl: { not: null },
        status: { notIn: ["ARQUIVADO", "CANCELADO"] },
      },
    }),
    isTicketsModuleEnabled()
      ? prisma.ticket.count({
          where: {
            scope: "SAAS",
            companyId: companyWhere.companyId,
            status: { in: ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] },
          },
        })
      : Promise.resolve(0),
    prisma.referral.findMany({
      where: companyWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        protocol: true,
        status: true,
        clinicalExamType: true,
        scheduledAt: true,
        createdAt: true,
        patient: { select: { fullName: true } },
      },
    }),
    prisma.document.findMany({
      where: {
        ...companyWhere,
        fileUrl: { not: null },
        status: { notIn: ["ARQUIVADO", "CANCELADO"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        updatedAt: true,
        patient: { select: { fullName: true } },
      },
    }),
    prisma.patient.findMany({
      where: {
        ...companyWhere,
        OR: [{ nextPeriodicDate: { lte: periodicDueDate } }, { nextPeriodicDate: null }],
        status: "ATIVO",
      },
      orderBy: { nextPeriodicDate: "asc" },
      take: 5,
      select: {
        id: true,
        fullName: true,
        nextPeriodicDate: true,
      },
    }),
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
  ]);

  void pendingDocs;
  void docsExpiring;

  const stats = [
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
      href: "/dashboard/encaminhamentos?status=AGENDADOS",
      show: true,
    },
    {
      key: "docs_available",
      title: "Prontos para baixar",
      value: docsAvailable,
      href: "/dashboard/documentos?card=PARA_BAIXAR",
      show: true,
    },
    {
      key: "periodic_due",
      title: "Periódicos a vencer",
      value: periodicDueCount,
      href: "/dashboard/colaboradores?periodicDue=true",
      show: true,
    },
    {
      key: "tickets_open",
      title: "Chamados abertos",
      value: openSaasTickets,
      href: "/dashboard/chamados?card=abertos",
      show: isTicketsModuleEnabled(),
    },
  ].filter((s) => s.show && isPathModuleEnabled(s.href));

  const pendingActions = [
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
        ? `${d.patient.fullName} — pronto para baixar`
        : "Documento pronto para baixar",
      href: `/dashboard/documentos?id=${d.id}`,
      type: "documento",
    })),
  ]
    .slice(0, 8)
    .filter((item) => isPathModuleEnabled(item.href));

  return {
    stats,
    pendingActions,
    priorityItems: [],
    recentActivities: [],
    recentPreReferrals: [],
    pendingDocuments: pendingDocList.map((d) => ({
      id: d.id,
      title: d.title,
      companyName: d.company?.tradeName ?? d.company?.legalName ?? null,
      status: d.status,
    })),
    negotiatingQuotes: [],
    recentReferrals: recentReferrals.map((r) => ({
      id: r.id,
      protocol: r.protocol,
      patientName: r.patient.fullName,
      clinicalExamType: r.clinicalExamType,
      status: r.status,
      scheduledAt: r.scheduledAt,
      createdAt: r.createdAt,
    })),
    availableDocuments: availableDocuments.map((d) => ({
      id: d.id,
      title: d.title,
      patientName: d.patient?.fullName ?? null,
      updatedAt: d.updatedAt,
    })),
    periodicDueCollaborators: periodicDueCollaborators.map((p) => ({
      id: p.id,
      name: p.fullName,
      nextPeriodicDate: p.nextPeriodicDate,
    })),
  };
}
