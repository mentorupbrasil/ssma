"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type {
  CommercialEntityType,
  CommercialHistoryAction,
  CommercialStage,
  LeadStatus,
  QuoteStatus,
  ContactMessageStatus,
  QuoteRejectReason,
} from "@prisma/client";
import { requirePermission } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { createAutoTask, getSettingBool } from "@/lib/auto-tasks";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import {
  buildLeadWhere,
  buildQuoteWhere,
  buildFollowUpWhere,
  getCommercialPageSize,
  serializeLeadListItem,
  serializeQuoteListItem,
  serializeFollowUpListItem,
  serializeContactListItem,
  dedupeLeadListItems,
  generateQuoteNumber,
  calcQuoteTotal,
  OPEN_LEAD_STATUSES,
  PENDING_QUOTE_STATUSES,
  stageToLeadStatus,
  resolveCommercialTab,
  COMMERCIAL_STAGE_LABELS,
  type CommercialFilters,
  type LeadDetailSerialized,
  type QuoteDetailSerialized,
  type ContactDetailSerialized,
  type CommercialHistoryItem,
  type CommercialNoteItem,
} from "@/lib/commercial";

type ActionResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

async function recordHistory(
  entityType: CommercialEntityType,
  entityId: string,
  action: CommercialHistoryAction,
  userId: string | null,
  opts?: { fromStatus?: string; toStatus?: string; notes?: string }
) {
  await prisma.commercialHistory.create({
    data: {
      entityType,
      entityId,
      action,
      fromStatus: opts?.fromStatus ?? null,
      toStatus: opts?.toStatus ?? null,
      notes: opts?.notes?.trim() || null,
      performedByUserId: userId,
    },
  });
}

async function fetchHistory(
  entityType: CommercialEntityType,
  entityId: string
): Promise<CommercialHistoryItem[]> {
  const rows = await prisma.commercialHistory.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { performedBy: { select: { name: true } } },
  });
  return rows.map((h) => ({
    id: h.id,
    entityType: h.entityType,
    entityId: h.entityId,
    entityLabel: "",
    action: h.action,
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    notes: h.notes,
    performedByName: h.performedBy?.name ?? null,
    createdAt: h.createdAt.toISOString(),
  }));
}

async function fetchNotes(
  entityType: CommercialEntityType,
  entityId: string
): Promise<CommercialNoteItem[]> {
  const rows = await prisma.commercialNote.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
  return rows.map((n) => ({
    id: n.id,
    content: n.content,
    createdByName: n.createdBy.name,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function listCommercialDashboard(filters: CommercialFilters = {}) {
  const pageSize = getCommercialPageSize(filters.pageSize);
  const page = Math.max(1, filters.page ?? 1);
  const tab = resolveCommercialTab(filters.tab);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [novosLeads, followupsAtrasados, propostasAguardando, fechadosMes] = await Promise.all([
    prisma.lead.count({ where: { type: "ORCAMENTO", stage: "NOVO_LEAD" } }),
    prisma.commercialFollowUp.count({
      where: { status: "PENDENTE", dueAt: { lt: todayStart } },
    }),
    prisma.quote.count({
      where: { status: { in: ["ENVIADO", "AGUARDANDO_RESPOSTA"] } },
    }),
    prisma.lead.count({
      where: {
        type: "ORCAMENTO",
        stage: "GANHO",
        updatedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
  ]);

  const statCounts = {
    novos_leads: novosLeads,
    followups_atrasados: followupsAtrasados,
    propostas_aguardando: propostasAguardando,
    fechados_mes: fechadosMes,
    // aliases legados
    solicitacoes_novas: novosLeads,
    em_negociacao: 0,
    aguardando_resposta: propostasAguardando,
    aprovados: fechadosMes,
    em_analise: 0,
    recusados: 0,
    contatos_sem_retorno: 0,
  };

  if (tab === "propostas") {
    const where = buildQuoteWhere(filters);
    const [items, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: { select: { serviceName: true }, orderBy: { sortOrder: "asc" } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.quote.count({ where }),
    ]);
    return {
      tab,
      items: items.map(serializeQuoteListItem),
      total,
      page,
      pageSize,
      statCounts,
    };
  }

  if (tab === "followups") {
    const where = buildFollowUpWhere(filters);
    const [items, total, atrasados, hoje, proximos] = await Promise.all([
      prisma.commercialFollowUp.findMany({
        where,
        orderBy: { dueAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          lead: { select: { id: true, name: true, companyName: true, phone: true } },
          assignedTo: { select: { name: true } },
        },
      }),
      prisma.commercialFollowUp.count({ where }),
      prisma.commercialFollowUp.count({
        where: { status: "PENDENTE", dueAt: { lt: todayStart } },
      }),
      prisma.commercialFollowUp.count({
        where: { status: "PENDENTE", dueAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.commercialFollowUp.count({
        where: { status: "PENDENTE", dueAt: { gt: todayEnd } },
      }),
    ]);
    return {
      tab,
      items: items.map(serializeFollowUpListItem),
      total,
      page,
      pageSize,
      statCounts,
      followUpBuckets: { atrasados, hoje, proximos },
    };
  }

  const where = buildLeadWhere(filters);
  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: [{ nextFollowUpAt: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignedTo: { select: { name: true } },
        sourcedQuotes: { select: { id: true }, take: 1, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    tab: "oportunidades" as const,
    items: dedupeLeadListItems(items.map(serializeLeadListItem)),
    total,
    page,
    pageSize,
    statCounts,
  };
}

export async function getLeadDetail(
  id: string
): Promise<ActionResult<{ lead: LeadDetailSerialized }>> {
  try {
    await requirePermission("leads.manage");
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { name: true } },
        sourcedQuotes: {
          include: {
            items: { select: { serviceName: true }, orderBy: { sortOrder: "asc" } },
            createdBy: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        followUps: {
          include: {
            lead: { select: { id: true, name: true, companyName: true, phone: true } },
            assignedTo: { select: { name: true } },
          },
          orderBy: { dueAt: "desc" },
        },
      },
    });
    if (!lead) return { success: false, error: "Oportunidade não encontrada." };
    const [history, notes] = await Promise.all([
      fetchHistory("LEAD", id),
      fetchNotes("LEAD", id),
    ]);
    return {
      success: true,
      lead: {
        ...serializeLeadListItem(lead),
        message: lead.message,
        sourcePage: lead.sourcePage,
        companyId: lead.companyId,
        contactMessageId: lead.contactMessageId,
        convertedQuoteId: lead.convertedQuoteId,
        cnpj: lead.cnpj,
        estimatedEmployees: lead.estimatedEmployees,
        lostReason: lead.lostReason,
        notes,
        history,
        quotes: lead.sourcedQuotes.map(serializeQuoteListItem),
        followUps: lead.followUps.map(serializeFollowUpListItem),
      },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao carregar oportunidade." };
  }
}

export async function getQuoteDetail(
  id: string
): Promise<ActionResult<{ quote: QuoteDetailSerialized }>> {
  try {
    await requirePermission("leads.manage");
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        createdBy: { select: { name: true } },
      },
    });
    if (!quote) return { success: false, error: "Proposta não encontrada." };
    const [history, notes] = await Promise.all([
      fetchHistory("QUOTE", id),
      fetchNotes("QUOTE", id),
    ]);
    return {
      success: true,
      quote: {
        ...serializeQuoteListItem(quote),
        companyId: quote.companyId,
        phone: quote.phone,
        email: quote.email,
        cnpj: quote.cnpj,
        city: quote.city,
        state: quote.state,
        paymentTerms: quote.paymentTerms,
        internalNotes: quote.internalNotes,
        clientNotes: quote.clientNotes,
        sourceLeadId: quote.sourceLeadId,
        items: quote.items.map((i) => ({
          id: i.id,
          serviceName: i.serviceName,
          category: i.category,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          notes: i.notes,
        })),
        notes,
        history,
      },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao carregar proposta." };
  }
}

export async function getContactDetail(
  id: string
): Promise<ActionResult<{ contact: ContactDetailSerialized }>> {
  try {
    await requirePermission("leads.manage");
    const contact = await prisma.contactMessage.findUnique({ where: { id } });
    if (!contact) return { success: false, error: "Mensagem não encontrada." };
    const history = await fetchHistory("CONTACT", id);
    return {
      success: true,
      contact: {
        ...serializeContactListItem(contact),
        email: contact.email,
        message: contact.message,
        source: contact.source,
        sourcePage: contact.sourcePage,
        serviceInterest: contact.serviceInterest,
        history,
      },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao carregar contato." };
  }
}

export type OpportunityFormInput = {
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  city?: string;
  cnpj?: string;
  estimatedEmployees?: number;
  serviceInterest?: string;
  message?: string;
  source?: string;
  assignedToUserId?: string;
  stage?: CommercialStage;
  nextFollowUpAt?: string;
  followUpAction?: string;
  notes?: string;
};

export async function createOpportunity(
  raw: OpportunityFormInput
): Promise<ActionResult<{ leadId: string }>> {
  try {
    const session = await requirePermission("leads.manage");
    if (!raw.name?.trim()) return { success: false, error: "Informe o contato principal." };
    if (!raw.companyName?.trim()) return { success: false, error: "Informe a empresa ou prospect." };

    const stage = raw.stage ?? "NOVO_LEAD";
    const lead = await prisma.lead.create({
      data: {
        type: "ORCAMENTO",
        status: stageToLeadStatus(stage),
        stage,
        name: raw.name.trim(),
        companyName: raw.companyName.trim(),
        phone: raw.phone?.trim() || null,
        email: raw.email?.trim() || null,
        city: raw.city?.trim() || null,
        cnpj: raw.cnpj?.replace(/\D/g, "") || null,
        estimatedEmployees: raw.estimatedEmployees ?? null,
        serviceInterest: raw.serviceInterest?.trim() || null,
        serviceTitle: raw.serviceInterest?.trim() || null,
        message: raw.message?.trim() || null,
        source: raw.source?.trim() || "manual",
        assignedToUserId: raw.assignedToUserId || session.user.id,
        nextFollowUpAt: raw.nextFollowUpAt ? new Date(raw.nextFollowUpAt) : null,
        followUpAction: raw.followUpAction?.trim() || null,
        notes: raw.notes?.trim() || null,
      },
    });

    await recordHistory("LEAD", lead.id, "CREATED", session.user.id, {
      notes: "Oportunidade criada manualmente",
      toStatus: stage,
    });

    if (raw.nextFollowUpAt) {
      await prisma.commercialFollowUp.create({
        data: {
          leadId: lead.id,
          dueAt: new Date(raw.nextFollowUpAt),
          action: raw.followUpAction?.trim() || "Contato comercial",
          assignedToUserId: raw.assignedToUserId || session.user.id,
          createdByUserId: session.user.id,
        },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Lead",
      entityId: lead.id,
      details: lead.companyName ?? lead.name,
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true, leadId: lead.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao criar oportunidade." };
  }
}

export async function updateOpportunity(
  leadId: string,
  raw: OpportunityFormInput
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!existing) return { success: false, error: "Oportunidade não encontrada." };

    const stage = raw.stage ?? existing.stage;
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        name: raw.name.trim(),
        companyName: raw.companyName?.trim() || null,
        phone: raw.phone?.trim() || null,
        email: raw.email?.trim() || null,
        city: raw.city?.trim() || null,
        cnpj: raw.cnpj?.replace(/\D/g, "") || null,
        estimatedEmployees: raw.estimatedEmployees ?? null,
        serviceInterest: raw.serviceInterest?.trim() || null,
        serviceTitle: raw.serviceInterest?.trim() || existing.serviceTitle,
        message: raw.message?.trim() || null,
        source: raw.source?.trim() || existing.source,
        assignedToUserId: raw.assignedToUserId || null,
        stage,
        status: stageToLeadStatus(stage),
        nextFollowUpAt: raw.nextFollowUpAt ? new Date(raw.nextFollowUpAt) : null,
        followUpAction: raw.followUpAction?.trim() || null,
        notes: raw.notes?.trim() || null,
      },
    });

    if (stage !== existing.stage) {
      await recordHistory("LEAD", leadId, "STATUS_CHANGED", session.user.id, {
        fromStatus: existing.stage,
        toStatus: stage,
        notes: `${COMMERCIAL_STAGE_LABELS[existing.stage]} → ${COMMERCIAL_STAGE_LABELS[stage]}`,
      });
    }

    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao atualizar oportunidade." };
  }
}

export async function updateOpportunityStage(
  leadId: string,
  stage: CommercialStage,
  opts?: { lostReason?: string; notes?: string }
): Promise<ActionResult<{ suggestConvert?: boolean }>> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!existing) return { success: false, error: "Oportunidade não encontrada." };

    if (stage === "PERDIDO" && !opts?.lostReason?.trim()) {
      return { success: false, error: "Informe o motivo da perda." };
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        stage,
        status: stageToLeadStatus(stage),
        lostReason: stage === "PERDIDO" ? opts?.lostReason?.trim() || null : existing.lostReason,
      },
    });

    await recordHistory("LEAD", leadId, "STATUS_CHANGED", session.user.id, {
      fromStatus: existing.stage,
      toStatus: stage,
      notes:
        opts?.notes?.trim() ||
        (stage === "PERDIDO"
          ? opts?.lostReason
          : `${COMMERCIAL_STAGE_LABELS[existing.stage]} → ${COMMERCIAL_STAGE_LABELS[stage]}`),
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true, suggestConvert: stage === "GANHO" && !existing.companyId };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao alterar etapa." };
  }
}

export async function registerOpportunityContact(
  leadId: string,
  content: string,
  opts?: { nextFollowUpAt?: string; followUpAction?: string; stage?: CommercialStage }
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!existing) return { success: false, error: "Oportunidade não encontrada." };
    if (!content.trim()) return { success: false, error: "Descreva o contato realizado." };

    const nextStage =
      opts?.stage ??
      (existing.stage === "NOVO_LEAD" ? "CONTATO_REALIZADO" : existing.stage);

    await prisma.commercialNote.create({
      data: {
        entityType: "LEAD",
        entityId: leadId,
        content: content.trim(),
        createdByUserId: session.user.id,
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        lastContactAt: new Date(),
        stage: nextStage,
        status: stageToLeadStatus(nextStage),
        nextFollowUpAt: opts?.nextFollowUpAt ? new Date(opts.nextFollowUpAt) : existing.nextFollowUpAt,
        followUpAction: opts?.followUpAction?.trim() || existing.followUpAction,
      },
    });

    await recordHistory("LEAD", leadId, "NOTE_ADDED", session.user.id, {
      notes: content.trim(),
      fromStatus: existing.stage,
      toStatus: nextStage,
    });

    if (opts?.nextFollowUpAt) {
      await prisma.commercialFollowUp.create({
        data: {
          leadId,
          dueAt: new Date(opts.nextFollowUpAt),
          action: opts.followUpAction?.trim() || "Retorno comercial",
          assignedToUserId: existing.assignedToUserId || session.user.id,
          createdByUserId: session.user.id,
        },
      });
    }

    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao registrar contato." };
  }
}

export async function scheduleFollowUp(input: {
  leadId: string;
  dueAt: string;
  action: string;
  assignedToUserId?: string;
  notes?: string;
}): Promise<ActionResult<{ followUpId: string }>> {
  try {
    const session = await requirePermission("leads.manage");
    const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
    if (!lead) return { success: false, error: "Oportunidade não encontrada." };
    if (!input.dueAt) return { success: false, error: "Informe a data do follow-up." };
    if (!input.action.trim()) return { success: false, error: "Informe a ação prevista." };

    const dueAt = new Date(input.dueAt);
    const followUp = await prisma.commercialFollowUp.create({
      data: {
        leadId: input.leadId,
        dueAt,
        action: input.action.trim(),
        notes: input.notes?.trim() || null,
        assignedToUserId: input.assignedToUserId || lead.assignedToUserId || session.user.id,
        createdByUserId: session.user.id,
      },
    });

    await prisma.lead.update({
      where: { id: input.leadId },
      data: {
        nextFollowUpAt: dueAt,
        followUpAction: input.action.trim(),
      },
    });

    await recordHistory("LEAD", input.leadId, "NOTE_ADDED", session.user.id, {
      notes: `Follow-up agendado: ${input.action.trim()}`,
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true, followUpId: followUp.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao agendar follow-up." };
  }
}

export async function completeFollowUp(input: {
  followUpId: string;
  result: string;
  notes?: string;
  nextDueAt?: string;
  nextAction?: string;
}): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.commercialFollowUp.findUnique({
      where: { id: input.followUpId },
      include: { lead: true },
    });
    if (!existing) return { success: false, error: "Follow-up não encontrado." };
    if (!input.result.trim()) return { success: false, error: "Informe o resultado do contato." };

    await prisma.commercialFollowUp.update({
      where: { id: input.followUpId },
      data: {
        status: "REALIZADO",
        result: input.result.trim(),
        notes: input.notes?.trim() || existing.notes,
        completedAt: new Date(),
      },
    });

    await prisma.commercialNote.create({
      data: {
        entityType: "LEAD",
        entityId: existing.leadId,
        content: `Follow-up realizado: ${input.result.trim()}${input.notes ? `\n${input.notes.trim()}` : ""}`,
        createdByUserId: session.user.id,
      },
    });

    await recordHistory("LEAD", existing.leadId, "NOTE_ADDED", session.user.id, {
      notes: `Follow-up concluído: ${input.result.trim()}`,
    });

    if (input.nextDueAt) {
      const nextDue = new Date(input.nextDueAt);
      const nextAction = input.nextAction?.trim() || "Retorno comercial";
      await prisma.commercialFollowUp.create({
        data: {
          leadId: existing.leadId,
          dueAt: nextDue,
          action: nextAction,
          assignedToUserId: existing.assignedToUserId || session.user.id,
          createdByUserId: session.user.id,
        },
      });
      await prisma.lead.update({
        where: { id: existing.leadId },
        data: {
          lastContactAt: new Date(),
          nextFollowUpAt: nextDue,
          followUpAction: nextAction,
          stage:
            existing.lead.stage === "NOVO_LEAD" ? "CONTATO_REALIZADO" : existing.lead.stage,
          status:
            existing.lead.stage === "NOVO_LEAD"
              ? "EM_CONTATO"
              : existing.lead.status,
        },
      });
    } else {
      await prisma.lead.update({
        where: { id: existing.leadId },
        data: {
          lastContactAt: new Date(),
          nextFollowUpAt: null,
          followUpAction: null,
        },
      });
    }

    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao concluir follow-up." };
  }
}

export async function rescheduleFollowUp(input: {
  followUpId: string;
  dueAt: string;
  action?: string;
}): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.commercialFollowUp.findUnique({ where: { id: input.followUpId } });
    if (!existing) return { success: false, error: "Follow-up não encontrado." };

    const dueAt = new Date(input.dueAt);
    await prisma.commercialFollowUp.update({
      where: { id: input.followUpId },
      data: {
        dueAt,
        action: input.action?.trim() || existing.action,
        status: "PENDENTE",
        completedAt: null,
      },
    });

    await prisma.lead.update({
      where: { id: existing.leadId },
      data: {
        nextFollowUpAt: dueAt,
        followUpAction: input.action?.trim() || existing.action,
      },
    });

    await recordHistory("LEAD", existing.leadId, "NOTE_ADDED", session.user.id, {
      notes: "Follow-up reagendado",
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao reagendar." };
  }
}

export async function convertOpportunityToCompany(input: {
  leadId: string;
  legalName?: string;
  cnpj: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  state?: string;
  responsibleName?: string;
  notes?: string;
}): Promise<ActionResult<{ companyId: string; linkedExisting?: boolean }>> {
  try {
    const session = await requirePermission("leads.manage");
    const lead = await prisma.lead.findUnique({
      where: { id: input.leadId },
      include: {
        sourcedQuotes: {
          where: { status: "APROVADO" },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });
    if (!lead) return { success: false, error: "Oportunidade não encontrada." };

    const cnpj = input.cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14) return { success: false, error: "Informe um CNPJ válido." };

    const existingCompany = await prisma.company.findUnique({ where: { cnpj } });
    if (existingCompany) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          companyId: existingCompany.id,
          stage: "GANHO",
          status: "FECHADO",
          cnpj,
        },
      });
      if (lead.sourcedQuotes[0]) {
        await prisma.quote.update({
          where: { id: lead.sourcedQuotes[0].id },
          data: { companyId: existingCompany.id },
        });
      }
      await recordHistory("LEAD", lead.id, "COMPANY_LINKED", session.user.id, {
        notes: `Vinculada à empresa existente ${existingCompany.legalName}`,
      });
      revalidatePath("/dashboard/orcamentos");
      revalidatePath("/dashboard/empresas");
      return { success: true, companyId: existingCompany.id, linkedExisting: true };
    }

    const approved = lead.sourcedQuotes[0];
    const phone = (input.phone || lead.phone || "").replace(/\D/g, "") || "00000000000";
    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          legalName: (input.legalName || lead.companyName || lead.name).trim(),
          tradeName: input.tradeName?.trim() || null,
          cnpj,
          email: input.email?.trim() || lead.email,
          phone: phone.slice(0, 20),
          whatsapp: (input.whatsapp || lead.phone || phone).replace(/\D/g, "").slice(0, 20) || phone,
          city: input.city?.trim() || lead.city,
          state: input.state?.trim() || null,
          responsibleName: input.responsibleName?.trim() || lead.name,
          notes:
            input.notes?.trim() ||
            [
              lead.serviceInterest ? `Serviços: ${lead.serviceInterest}` : null,
              approved ? `Proposta ${approved.quoteNumber}` : null,
              lead.message,
            ]
              .filter(Boolean)
              .join("\n") || null,
          status: "ATIVA",
          clinicId: session.user.clinicId ?? null,
        },
      });

      await tx.companyHistory.create({
        data: {
          companyId: created.id,
          action: "CREATED",
          notes: `Convertida da oportunidade comercial ${lead.companyName ?? lead.name}`,
          performedByUserId: session.user.id,
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          companyId: created.id,
          stage: "GANHO",
          status: "FECHADO",
          cnpj,
        },
      });

      if (approved) {
        await tx.quote.update({
          where: { id: approved.id },
          data: { companyId: created.id },
        });
      }

      return created;
    });

    await recordHistory("LEAD", lead.id, "COMPANY_LINKED", session.user.id, {
      notes: `Convertida em empresa ${company.legalName}`,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Company",
      entityId: company.id,
      details: `Conversão comercial: ${company.legalName}`,
    });

    revalidatePath("/dashboard/orcamentos");
    revalidatePath("/dashboard/empresas");
    return { success: true, companyId: company.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao converter em empresa." };
  }
}

type QuoteItemInput = {
  serviceName: string;
  category?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
};

type QuoteFormInput = {
  companyId?: string;
  companyName: string;
  responsibleName?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  city?: string;
  state?: string;
  status?: QuoteStatus;
  validUntil?: string;
  paymentTerms?: string;
  internalNotes?: string;
  clientNotes?: string;
  items: QuoteItemInput[];
  sourceLeadId?: string;
  sendOnSave?: boolean;
};

export async function createQuote(
  raw: QuoteFormInput
): Promise<ActionResult<{ quoteId: string }>> {
  try {
    const session = await requirePermission("leads.manage");
    if (!raw.companyName?.trim()) return { success: false, error: "Nome da empresa obrigatório." };
    if (!raw.items?.length) return { success: false, error: "Adicione ao menos um serviço." };
    if (!raw.sourceLeadId) {
      return { success: false, error: "Selecione a oportunidade vinculada à proposta." };
    }

    const quoteNumber = await generateQuoteNumber();
    const totalAmount = calcQuoteTotal(raw.items);
    const status: QuoteStatus = raw.sendOnSave
      ? "AGUARDANDO_RESPOSTA"
      : raw.status ?? "RASCUNHO";

    const quote = await prisma.$transaction(async (tx) => {
      const created = await tx.quote.create({
        data: {
          quoteNumber,
          companyId: raw.companyId || null,
          companyName: raw.companyName.trim(),
          responsibleName: raw.responsibleName?.trim() || null,
          phone: raw.phone?.trim() || null,
          email: raw.email?.trim() || null,
          cnpj: raw.cnpj?.trim() || null,
          city: raw.city?.trim() || null,
          state: raw.state?.trim() || null,
          status,
          totalAmount: totalAmount > 0 ? totalAmount : null,
          validUntil: raw.validUntil ? new Date(raw.validUntil) : null,
          paymentTerms: raw.paymentTerms?.trim() || null,
          internalNotes: raw.internalNotes?.trim() || null,
          clientNotes: raw.clientNotes?.trim() || null,
          sourceLeadId: raw.sourceLeadId || null,
          createdByUserId: session.user.id,
          items: {
            create: raw.items.map((item, idx) => ({
              serviceName: item.serviceName.trim(),
              category: item.category?.trim() || null,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice ?? null,
              totalPrice:
                item.totalPrice ??
                (item.unitPrice != null ? item.unitPrice * (item.quantity || 1) : null),
              notes: item.notes?.trim() || null,
              sortOrder: idx,
            })),
          },
        },
      });

      await tx.commercialHistory.create({
        data: {
          entityType: "QUOTE",
          entityId: created.id,
          action: "CREATED",
          performedByUserId: session.user.id,
        },
      });

      if (raw.sendOnSave) {
        await tx.commercialHistory.create({
          data: {
            entityType: "QUOTE",
            entityId: created.id,
            action: "QUOTE_SENT",
            toStatus: status,
            performedByUserId: session.user.id,
          },
        });
      }

      if (raw.sourceLeadId) {
        await tx.lead.update({
          where: { id: raw.sourceLeadId },
          data: {
            status: "PROPOSTA_ENVIADA",
            stage: raw.sendOnSave ? "PROPOSTA_ENVIADA" : "PROPOSTA_ENVIADA",
            convertedQuoteId: created.id,
          },
        });
        await tx.commercialHistory.create({
          data: {
            entityType: "LEAD",
            entityId: raw.sourceLeadId,
            action: "QUOTE_CREATED",
            notes: quoteNumber,
            toStatus: "PROPOSTA_ENVIADA",
            performedByUserId: session.user.id,
          },
        });
      }

      return created;
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Quote",
      entityId: quote.id,
      details: quote.quoteNumber,
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true, quoteId: quote.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao criar proposta." };
  }
}

export async function updateQuote(
  quoteId: string,
  raw: QuoteFormInput
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!existing) return { success: false, error: "Proposta não encontrada." };

    const totalAmount = calcQuoteTotal(raw.items);
    const status = raw.sendOnSave ? "AGUARDANDO_RESPOSTA" : raw.status ?? existing.status;

    await prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId } });
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          companyId: raw.companyId || null,
          companyName: raw.companyName.trim(),
          responsibleName: raw.responsibleName?.trim() || null,
          phone: raw.phone?.trim() || null,
          email: raw.email?.trim() || null,
          cnpj: raw.cnpj?.trim() || null,
          city: raw.city?.trim() || null,
          state: raw.state?.trim() || null,
          status,
          totalAmount: totalAmount > 0 ? totalAmount : null,
          validUntil: raw.validUntil ? new Date(raw.validUntil) : null,
          paymentTerms: raw.paymentTerms?.trim() || null,
          internalNotes: raw.internalNotes?.trim() || null,
          clientNotes: raw.clientNotes?.trim() || null,
          sourceLeadId: raw.sourceLeadId || existing.sourceLeadId,
          items: {
            create: raw.items.map((item, idx) => ({
              serviceName: item.serviceName.trim(),
              category: item.category?.trim() || null,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice ?? null,
              totalPrice:
                item.totalPrice ??
                (item.unitPrice != null ? item.unitPrice * (item.quantity || 1) : null),
              notes: item.notes?.trim() || null,
              sortOrder: idx,
            })),
          },
        },
      });

      await tx.commercialHistory.create({
        data: {
          entityType: "QUOTE",
          entityId: quoteId,
          action: "STATUS_CHANGED",
          fromStatus: existing.status,
          toStatus: status,
          performedByUserId: session.user.id,
        },
      });
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao atualizar proposta." };
  }
}

export async function updateLeadStatusCommercial(
  leadId: string,
  status: LeadStatus
): Promise<ActionResult> {
  const { leadStatusToStage } = await import("@/lib/commercial");
  return updateOpportunityStage(leadId, leadStatusToStage(status));
}

export async function updateContactStatusCommercial(
  contactId: string,
  status: ContactMessageStatus
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.contactMessage.findUnique({ where: { id: contactId } });
    if (!existing) return { success: false, error: "Mensagem não encontrada." };

    await prisma.contactMessage.update({ where: { id: contactId }, data: { status } });
    await recordHistory("CONTACT", contactId, "STATUS_CHANGED", session.user.id, {
      fromStatus: existing.status,
      toStatus: status,
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao alterar status." };
  }
}

export async function updateQuoteStatusCommercial(
  quoteId: string,
  status: QuoteStatus,
  opts?: { notes?: string; rejectReason?: QuoteRejectReason }
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true },
    });
    if (!existing) return { success: false, error: "Proposta não encontrada." };

    const action: CommercialHistoryAction =
      status === "APROVADO"
        ? "QUOTE_APPROVED"
        : status === "RECUSADO"
          ? "QUOTE_REJECTED"
          : status === "ENVIADO" || status === "AGUARDANDO_RESPOSTA"
            ? "QUOTE_SENT"
            : "STATUS_CHANGED";

    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status,
        rejectReason: opts?.rejectReason ?? null,
        rejectNotes: opts?.notes?.trim() || null,
      },
    });

    await recordHistory("QUOTE", quoteId, action, session.user.id, {
      fromStatus: existing.status,
      toStatus: status,
      notes: opts?.notes,
    });

    if (existing.sourceLeadId) {
      if (status === "APROVADO") {
        await prisma.lead.update({
          where: { id: existing.sourceLeadId },
          data: { stage: "GANHO", status: "FECHADO" },
        });
      } else if (status === "RECUSADO") {
        await prisma.lead.update({
          where: { id: existing.sourceLeadId },
          data: { stage: "EM_NEGOCIACAO", status: "EM_ANALISE" },
        });
      } else if (status === "ENVIADO" || status === "AGUARDANDO_RESPOSTA") {
        await prisma.lead.update({
          where: { id: existing.sourceLeadId },
          data: { stage: "PROPOSTA_ENVIADA", status: "PROPOSTA_ENVIADA" },
        });
      }
    }

    if (status === "APROVADO" && existing.status !== "APROVADO") {
      const clinicId = session.user.clinicId ?? null;
      const autoReceivable = await getSettingBool(clinicId, "fin.auto_receivable_on_quote", true);
      const total =
        existing.totalAmount ??
        existing.items.reduce((sum, i) => sum + (i.totalPrice ?? (i.unitPrice ?? 0) * i.quantity), 0);

      if (autoReceivable && total > 0) {
        const existingEntry = await prisma.financialEntry.findFirst({
          where: { quoteId, type: "RECEBER" },
        });
        if (!existingEntry) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);
          await prisma.financialEntry.create({
            data: {
              clinicId,
              type: "RECEBER",
              source: "ORCAMENTO",
              description: `Proposta ${existing.quoteNumber} — ${existing.companyName}`,
              amount: total,
              dueDate,
              companyId: existing.companyId,
              quoteId,
              status: "AGUARDANDO_FATURAMENTO",
            },
          });
        }
      }

      await createAutoTask({
        clinicId,
        createdByUserId: session.user.id,
        title: `Formalizar contrato — ${existing.companyName}`,
        description: `Proposta ${existing.quoteNumber} aprovada. Verificar contrato e condições comerciais.`,
        priority: "ALTA",
        dueDate: new Date(Date.now() + 3 * 86400000),
        companyId: existing.companyId ?? undefined,
        origin: "COMERCIAL",
        linkUrl: "/dashboard/orcamentos",
        sourceKey: `quote-approved:${quoteId}`,
      });
    }

    revalidatePath("/dashboard/orcamentos");
    revalidatePath("/dashboard/financeiro");
    revalidatePath("/dashboard/tarefas");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao alterar status." };
  }
}

export async function addCommercialNote(
  entityType: CommercialEntityType,
  entityId: string,
  content: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    if (!content.trim()) return { success: false, error: "Observação obrigatória." };

    await prisma.commercialNote.create({
      data: {
        entityType,
        entityId,
        content: content.trim(),
        createdByUserId: session.user.id,
      },
    });
    await recordHistory(entityType, entityId, "NOTE_ADDED", session.user.id, {
      notes: content.trim(),
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao adicionar nota." };
  }
}

export async function linkLeadToCompany(
  leadId: string,
  companyId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    await prisma.lead.update({
      where: { id: leadId },
      data: { companyId },
    });
    await recordHistory("LEAD", leadId, "COMPANY_LINKED", session.user.id, { notes: companyId });
    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao vincular empresa." };
  }
}

export async function duplicateQuote(quoteId: string): Promise<ActionResult<{ quoteId: string }>> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true },
    });
    if (!existing) return { success: false, error: "Proposta não encontrada." };

    const quoteNumber = await generateQuoteNumber();
    const copy = await prisma.$transaction(async (tx) => {
      const created = await tx.quote.create({
        data: {
          quoteNumber,
          companyId: existing.companyId,
          companyName: existing.companyName,
          responsibleName: existing.responsibleName,
          phone: existing.phone,
          email: existing.email,
          cnpj: existing.cnpj,
          city: existing.city,
          state: existing.state,
          status: "RASCUNHO",
          totalAmount: existing.totalAmount,
          validUntil: existing.validUntil,
          paymentTerms: existing.paymentTerms,
          internalNotes: existing.internalNotes,
          clientNotes: existing.clientNotes,
          sourceLeadId: existing.sourceLeadId,
          createdByUserId: session.user.id,
          items: {
            create: existing.items.map((item, idx) => ({
              serviceName: item.serviceName,
              category: item.category,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              notes: item.notes,
              sortOrder: idx,
            })),
          },
        },
      });
      await tx.commercialHistory.create({
        data: {
          entityType: "QUOTE",
          entityId: created.id,
          action: "QUOTE_DUPLICATED",
          notes: `Cópia de ${existing.quoteNumber}`,
          performedByUserId: session.user.id,
        },
      });
      return created;
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true, quoteId: copy.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao duplicar proposta." };
  }
}

export async function recordWhatsAppOpened(
  entityType: CommercialEntityType,
  entityId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    await recordHistory(entityType, entityId, "WHATSAPP_OPENED", session.user.id);
    if (entityType === "LEAD") {
      await prisma.lead.update({
        where: { id: entityId },
        data: { lastContactAt: new Date() },
      });
    }
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function recordEmailSent(
  entityType: CommercialEntityType,
  entityId: string,
  toEmail?: string,
  subject?: string,
  body?: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    if (toEmail && subject && body) {
      await sendEmail({ to: toEmail, subject, html: body });
    }
    await recordHistory(entityType, entityId, "EMAIL_SENT", session.user.id);
    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function createCommercialLeadFromContact(
  contactId: string
): Promise<ActionResult<{ leadId: string }>> {
  try {
    const session = await requirePermission("leads.manage");
    const contact = await prisma.contactMessage.findUnique({ where: { id: contactId } });
    if (!contact) return { success: false, error: "Mensagem não encontrada." };

    const lead = await prisma.lead.create({
      data: {
        type: "ORCAMENTO",
        status: "NOVO",
        stage: "NOVO_LEAD",
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        companyName: contact.company,
        serviceInterest: contact.serviceInterest ?? contact.subject,
        message: contact.message,
        source: contact.source,
        sourcePage: contact.sourcePage,
        contactMessageId: contact.id,
      },
    });

    await recordHistory("LEAD", lead.id, "CREATED", session.user.id, {
      notes: `A partir do contato: ${contact.subject}`,
    });
    await recordHistory("CONTACT", contactId, "QUOTE_CREATED", session.user.id);

    revalidatePath("/dashboard/orcamentos");
    return { success: true, leadId: lead.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao criar oportunidade." };
  }
}

export async function listOpportunitiesForSelect() {
  await requirePermission("leads.manage");
  return prisma.lead.findMany({
    where: {
      type: "ORCAMENTO",
      stage: { notIn: ["PERDIDO"] },
    },
    select: {
      id: true,
      name: true,
      companyName: true,
      phone: true,
      email: true,
      city: true,
      cnpj: true,
      companyId: true,
      serviceInterest: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 300,
  });
}

export async function getCompaniesForQuoteSelect() {
  await requirePermission("leads.manage");
  return prisma.company.findMany({
    where: { status: "ATIVA" },
    select: {
      id: true,
      legalName: true,
      tradeName: true,
      cnpj: true,
      city: true,
      state: true,
      responsibleName: true,
      whatsapp: true,
      email: true,
    },
    orderBy: { legalName: "asc" },
    take: 500,
  });
}

export async function countPendingQuotes() {
  return prisma.quote.count({
    where: { status: { in: PENDING_QUOTE_STATUSES } },
  });
}

export async function countOpenLeads() {
  return prisma.lead.count({
    where: { type: "ORCAMENTO", status: { in: OPEN_LEAD_STATUSES } },
  });
}
