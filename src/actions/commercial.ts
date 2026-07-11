"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type {
  CommercialEntityType,
  CommercialHistoryAction,
  LeadStatus,
  QuoteStatus,
  ContactMessageStatus,
  QuoteRejectReason,
} from "@prisma/client";
import { requirePermission } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { createAutoTask, getSettingBool } from "@/lib/auto-tasks";
import {
  buildLeadWhere,
  buildQuoteWhere,
  buildContactWhere,
  getCommercialPageSize,
  serializeLeadListItem,
  serializeQuoteListItem,
  serializeContactListItem,
  dedupeLeadListItems,
  generateQuoteNumber,
  calcQuoteTotal,
  OPEN_LEAD_STATUSES,
  PENDING_QUOTE_STATUSES,
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
  const pageSize = getCommercialPageSize();
  const page = Math.max(1, filters.page ?? 1);
  const tab = filters.tab ?? "solicitacoes";

  const [
    solicitacoesNovas,
    emNegociacao,
    aguardandoResposta,
    aprovados,
    recusados,
    contatosSemRetorno,
  ] = await Promise.all([
    prisma.lead.count({ where: { type: "ORCAMENTO", status: "NOVO" } }),
    prisma.lead.count({
      where: {
        type: "ORCAMENTO",
        status: { in: ["EM_ANALISE", "EM_CONTATO", "AGUARDANDO_RETORNO", "PROPOSTA_ENVIADA"] },
      },
    }),
    prisma.quote.count({ where: { status: "AGUARDANDO_RESPOSTA" } }),
    prisma.quote.count({ where: { status: "APROVADO" } }),
    prisma.quote.count({ where: { status: "RECUSADO" } }),
    prisma.contactMessage.count({ where: { status: "NOVO" } }),
  ]);

  const statCounts = {
    solicitacoes_novas: solicitacoesNovas,
    em_negociacao: emNegociacao,
    aguardando_resposta: aguardandoResposta,
    aprovados,
    // aliases / filtros secundários
    em_analise: emNegociacao,
    recusados,
    contatos_sem_retorno: contatosSemRetorno,
  };

  if (tab === "orcamentos") {
    const where = buildQuoteWhere(filters);
    const [items, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: { select: { serviceName: true }, orderBy: { sortOrder: "asc" } } },
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

  if (tab === "contatos") {
    const where = buildContactWhere(filters);
    const [items, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contactMessage.count({ where }),
    ]);
    return {
      tab,
      items: items.map(serializeContactListItem),
      total,
      page,
      pageSize,
      statCounts,
    };
  }

  if (tab === "historico") {
    const [items, total] = await Promise.all([
      prisma.commercialHistory.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { performedBy: { select: { name: true } } },
      }),
      prisma.commercialHistory.count(),
    ]);
    const enriched = await Promise.all(
      items.map(async (h) => {
        let entityLabel = h.entityId;
        if (h.entityType === "LEAD") {
          const lead = await prisma.lead.findUnique({
            where: { id: h.entityId },
            select: { name: true, companyName: true },
          });
          entityLabel = lead ? `${lead.name}${lead.companyName ? ` — ${lead.companyName}` : ""}` : entityLabel;
        } else if (h.entityType === "QUOTE") {
          const quote = await prisma.quote.findUnique({
            where: { id: h.entityId },
            select: { quoteNumber: true, companyName: true },
          });
          entityLabel = quote ? `${quote.quoteNumber} — ${quote.companyName}` : entityLabel;
        } else {
          const contact = await prisma.contactMessage.findUnique({
            where: { id: h.entityId },
            select: { name: true, subject: true },
          });
          entityLabel = contact ? `${contact.name} — ${contact.subject}` : entityLabel;
        }
        return {
          id: h.id,
          entityType: h.entityType,
          entityId: h.entityId,
          entityLabel,
          action: h.action,
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          notes: h.notes,
          performedByName: h.performedBy?.name ?? null,
          createdAt: h.createdAt.toISOString(),
        } satisfies CommercialHistoryItem;
      })
    );
    return { tab, items: enriched, total, page, pageSize, statCounts };
  }

  const where = buildLeadWhere(filters);
  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { assignedTo: { select: { name: true } } },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    tab: "solicitacoes" as const,
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
      include: { assignedTo: { select: { name: true } } },
    });
    if (!lead) return { success: false, error: "Solicitação não encontrada." };
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
        notes,
        history,
      },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao carregar solicitação." };
  }
}

export async function getQuoteDetail(
  id: string
): Promise<ActionResult<{ quote: QuoteDetailSerialized }>> {
  try {
    await requirePermission("leads.manage");
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!quote) return { success: false, error: "Orçamento não encontrado." };
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
    return { success: false, error: e instanceof Error ? e.message : "Erro ao carregar orçamento." };
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
    return { success: false, error: e instanceof Error ? e.message : "Erro ao carregar mensagem." };
  }
}

type QuoteItemInput = {
  serviceName: string;
  category?: string;
  quantity: number;
  unitPrice?: number | null;
  totalPrice?: number | null;
  notes?: string;
};

type QuoteFormInput = {
  companyId?: string | null;
  companyName: string;
  responsibleName?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  city?: string;
  state?: string;
  validUntil?: string | null;
  paymentTerms?: string;
  internalNotes?: string;
  clientNotes?: string;
  status?: QuoteStatus;
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

    const quoteNumber = await generateQuoteNumber();
    const totalAmount = calcQuoteTotal(raw.items);
    const status: QuoteStatus = raw.sendOnSave ? "ENVIADO" : raw.status ?? "RASCUNHO";

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
            toStatus: "ENVIADO",
            performedByUserId: session.user.id,
          },
        });
      }

      if (raw.sourceLeadId) {
        await tx.lead.update({
          where: { id: raw.sourceLeadId },
          data: {
            status: "CONVERTIDO_ORCAMENTO",
            convertedQuoteId: created.id,
          },
        });
        await tx.commercialHistory.create({
          data: {
            entityType: "LEAD",
            entityId: raw.sourceLeadId,
            action: "QUOTE_CREATED",
            notes: quoteNumber,
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
    return { success: false, error: e instanceof Error ? e.message : "Erro ao criar orçamento." };
  }
}

export async function updateQuote(
  quoteId: string,
  raw: QuoteFormInput
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!existing) return { success: false, error: "Orçamento não encontrado." };

    const totalAmount = calcQuoteTotal(raw.items);
    const status = raw.sendOnSave ? "ENVIADO" : raw.status ?? existing.status;

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
    return { success: false, error: e instanceof Error ? e.message : "Erro ao atualizar orçamento." };
  }
}

export async function updateLeadStatusCommercial(
  leadId: string,
  status: LeadStatus
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    const existing = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!existing) return { success: false, error: "Solicitação não encontrada." };

    await prisma.lead.update({ where: { id: leadId }, data: { status } });
    await recordHistory("LEAD", leadId, "STATUS_CHANGED", session.user.id, {
      fromStatus: existing.status,
      toStatus: status,
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao alterar status." };
  }
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
    if (!existing) return { success: false, error: "Orçamento não encontrado." };

    const action: CommercialHistoryAction =
      status === "APROVADO"
        ? "QUOTE_APPROVED"
        : status === "RECUSADO"
          ? "QUOTE_REJECTED"
          : status === "ENVIADO"
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
              description: `Orçamento ${existing.quoteNumber} — ${existing.companyName}`,
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
        description: `Orçamento ${existing.quoteNumber} aprovado. Verificar contrato e condições comerciais.`,
        priority: "ALTA",
        dueDate: new Date(Date.now() + 3 * 86400000),
        companyId: existing.companyId ?? undefined,
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
    if (!existing) return { success: false, error: "Orçamento não encontrado." };

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
    return { success: false, error: e instanceof Error ? e.message : "Erro ao duplicar orçamento." };
  }
}

export async function recordWhatsAppOpened(
  entityType: CommercialEntityType,
  entityId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("leads.manage");
    await recordHistory(entityType, entityId, "WHATSAPP_OPENED", session.user.id);
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
    return { success: false, error: e instanceof Error ? e.message : "Erro ao criar solicitação." };
  }
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
