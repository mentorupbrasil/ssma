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

type ActivityDraft = {
  id: string;
  groupKind: string;
  groupScope: string;
  descriptionSingular: string;
  descriptionGrouped: (count: number) => string;
  listHref: string;
  actor: string;
  at: Date;
  href?: string;
  exactKey: string;
};

function resolveActivityActor(name: string | null | undefined): string {
  if (!name?.trim()) return "Ação automática";
  const normalized = name.trim();
  if (/^(system|sistema|seed)$/i.test(normalized)) return "Ação automática";
  return normalized;
}

function consolidateRecentActivities(drafts: ActivityDraft[]): DashboardActivityItem[] {
  const sorted = [...drafts].sort((a, b) => b.at.getTime() - a.at.getTime());
  const seenExact = new Set<string>();
  const unique = sorted.filter((item) => {
    if (seenExact.has(item.exactKey)) return false;
    seenExact.add(item.exactKey);
    return true;
  });

  const WINDOW_MS = 2 * 60 * 60 * 1000;
  const result: DashboardActivityItem[] = [];
  let i = 0;
  while (i < unique.length) {
    const first = unique[i];
    let count = 1;
    let j = i + 1;
    const canGroup = Boolean(first.groupScope) || first.groupKind.startsWith("doc_");

    while (canGroup && j < unique.length) {
      const next = unique[j];
      const sameKind = next.groupKind === first.groupKind;
      const sameScope = next.groupScope === first.groupScope;
      const closeEnough = Math.abs(first.at.getTime() - next.at.getTime()) <= WINDOW_MS;
      if (!sameKind || !sameScope || !closeEnough) break;
      count += 1;
      j += 1;
    }

    if (count > 1) {
      const realActor = unique
        .slice(i, j)
        .map((item) => item.actor)
        .find((name) => name !== "Ação automática");

      result.push({
        id: `grp-${first.groupKind}-${first.id}-${count}`,
        description: first.descriptionGrouped(count),
        actor: realActor ?? "Ação automática",
        at: first.at,
        href: first.listHref,
      });
      i = j;
    } else {
      result.push({
        id: first.id,
        description: first.descriptionSingular,
        actor: first.actor,
        at: first.at,
        href: first.href,
      });
      i += 1;
    }
  }

  return result.slice(0, 6);
}

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
      title: "Documentos a vencer",
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

  const activityDrafts: ActivityDraft[] = [];

  for (const h of recentDocHistory) {
    const isRelease = h.action === "PORTAL_ENABLED" || h.action === "SENT";
    const groupKind = isRelease ? "doc_released" : "doc_attached";
    activityDrafts.push({
      id: `dochist-${h.id}`,
      groupKind,
      groupScope: groupKind,
      descriptionSingular: isRelease
        ? `Documento liberado: ${h.document.title}`
        : `Documento anexado: ${h.document.title}`,
      descriptionGrouped: (count) =>
        isRelease
          ? `${count} documentos liberados`
          : `${count} documentos anexados`,
      listHref: "/dashboard/documentos",
      actor: resolveActivityActor(h.performedBy?.name),
      at: h.createdAt,
      href: `/dashboard/documentos?id=${h.document.id}`,
      exactKey: `${groupKind}:${h.document.id}:${h.action}`,
    });
  }

  for (const c of recentCompanies) {
    const name = companyLabel(c);
    activityDrafts.push({
      id: `company-${c.id}`,
      groupKind: "company_created",
      groupScope: "all",
      descriptionSingular: `Empresa cadastrada: ${name}`,
      descriptionGrouped: (count) => `${count} empresas cadastradas`,
      listHref: "/dashboard/empresas",
      actor: "Ação automática",
      at: c.createdAt,
      href: `/dashboard/empresas/${c.id}`,
      exactKey: `company:${c.id}`,
    });
  }

  for (const p of recentPatients) {
    const company = companyLabel(p.company);
    const scope = company === "Sem empresa" ? "" : company;
    activityDrafts.push({
      id: `patient-${p.id}`,
      groupKind: "patient_created",
      groupScope: scope.toLowerCase(),
      descriptionSingular: `Colaborador cadastrado: ${p.fullName}`,
      descriptionGrouped: (count) =>
        scope
          ? `${count} colaboradores cadastrados na ${scope}`
          : `${count} colaboradores cadastrados`,
      listHref: "/dashboard/colaboradores",
      actor: "Ação automática",
      at: p.createdAt,
      href: `/dashboard/colaboradores/${p.id}`,
      exactKey: `patient:${p.id}`,
    });
  }

  for (const r of recentReferralsCreated) {
    const company = companyLabel(r.company);
    const scope = company === "Sem empresa" ? "" : company;
    activityDrafts.push({
      id: `referral-${r.id}`,
      groupKind: "referral_created",
      groupScope: scope.toLowerCase(),
      descriptionSingular: `Atendimento criado: ${r.patient.fullName}`,
      descriptionGrouped: (count) =>
        scope
          ? `${count} atendimentos criados na ${scope}`
          : `${count} atendimentos criados`,
      listHref: "/dashboard/encaminhamentos",
      actor: "Ação automática",
      at: r.createdAt,
      href: `/dashboard/encaminhamentos?id=${r.id}`,
      exactKey: `referral:${r.id}`,
    });
  }

  for (const t of recentTicketsUpdated) {
    activityDrafts.push({
      id: `ticket-${t.id}`,
      groupKind: "ticket_updated",
      groupScope: "all",
      descriptionSingular: `Chamado atualizado: ${t.subject}`,
      descriptionGrouped: (count) => `${count} chamados atualizados`,
      listHref: "/dashboard/chamados",
      actor: resolveActivityActor(t.assignedTo?.name ?? t.createdBy.name),
      at: t.updatedAt,
      href: `/dashboard/chamados?id=${t.id}`,
      exactKey: `ticket:${t.id}:${t.updatedAt.toISOString()}`,
    });
  }

  const recentActivities = consolidateRecentActivities(activityDrafts);

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
