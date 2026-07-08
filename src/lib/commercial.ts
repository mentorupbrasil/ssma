import type {
  Lead,
  LeadStatus,
  Quote,
  QuoteStatus,
  QuoteItem,
  ContactMessage,
  ContactMessageStatus,
  CommercialEntityType,
  CommercialHistoryAction,
  QuoteRejectReason,
  Prisma,
} from "@prisma/client";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";
import { getClinicInfo } from "@/lib/helpers";

export const COMMERCIAL_STAT_CARDS: { key: string; filter: string; label: string }[] = [
  { key: "solicitacoes_novas", filter: "LEAD_NOVO", label: "Solicitações novas" },
  { key: "em_analise", filter: "EM_ANALISE", label: "Em análise" },
  { key: "orcamentos_enviados", filter: "QUOTE_ENVIADO", label: "Orçamentos enviados" },
  { key: "aguardando_resposta", filter: "QUOTE_AGUARDANDO", label: "Aguardando resposta" },
  { key: "aprovados", filter: "QUOTE_APROVADO", label: "Aprovados" },
  { key: "recusados", filter: "QUOTE_RECUSADO", label: "Recusados" },
  { key: "contatos_sem_retorno", filter: "CONTACT_NOVO", label: "Contatos sem retorno" },
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NOVO: "Novo",
  EM_ANALISE: "Em análise",
  EM_CONTATO: "Em contato",
  AGUARDANDO_RETORNO: "Aguardando retorno",
  CONVERTIDO_ORCAMENTO: "Convertido em orçamento",
  PROPOSTA_ENVIADA: "Proposta enviada",
  FECHADO: "Fechado",
  PERDIDO: "Perdido",
  EXPIRADO: "Expirado",
  ARQUIVADO: "Arquivado",
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  RASCUNHO: "Rascunho",
  EM_ANALISE: "Em análise",
  ENVIADO: "Enviado",
  AGUARDANDO_RESPOSTA: "Aguardando resposta",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
  CANCELADO: "Cancelado",
};

export const QUOTE_REJECT_LABELS: Record<QuoteRejectReason, string> = {
  VALOR: "Valor",
  SEM_RESPOSTA: "Cliente não respondeu",
  OUTRO_FORNECEDOR: "Contratou outro fornecedor",
  SEM_INTERESSE: "Sem interesse no momento",
  OUTRO: "Outro",
};

export const COMMERCIAL_HISTORY_LABELS: Record<CommercialHistoryAction, string> = {
  CREATED: "Registro criado",
  STATUS_CHANGED: "Status alterado",
  NOTE_ADDED: "Observação adicionada",
  WHATSAPP_OPENED: "WhatsApp aberto",
  EMAIL_SENT: "E-mail enviado",
  QUOTE_CREATED: "Orçamento criado",
  QUOTE_SENT: "Orçamento enviado",
  QUOTE_APPROVED: "Orçamento aprovado",
  QUOTE_REJECTED: "Orçamento recusado",
  QUOTE_DUPLICATED: "Orçamento duplicado",
  COMPANY_LINKED: "Empresa vinculada",
  REFERRAL_CREATED: "Encaminhamento criado",
  PORTAL_ENABLED: "Portal ativado",
  ARCHIVED: "Arquivado",
};

export const SUGGESTED_QUOTE_SERVICES = [
  "ASO admissional",
  "ASO periódico",
  "ASO demissional",
  "PCMSO",
  "PGR",
  "LTCAT",
  "Laudo de insalubridade",
  "Laudo de periculosidade",
  "Exames complementares",
  "Treinamentos",
  "Portal empresarial",
  "Pacote personalizado",
] as const;

export const PENDING_QUOTE_STATUSES: QuoteStatus[] = ["ENVIADO", "AGUARDANDO_RESPOSTA"];

export const OPEN_LEAD_STATUSES: LeadStatus[] = [
  "NOVO",
  "EM_ANALISE",
  "EM_CONTATO",
  "AGUARDANDO_RETORNO",
];

export const QUOTE_REQUEST_SUBJECT = "Solicitar orçamento";

export type CommercialTab = "solicitacoes" | "orcamentos" | "contatos" | "historico";

export type CommercialFilters = {
  q?: string;
  card?: string;
  status?: string;
  tipo?: string;
  origem?: string;
  dateFrom?: string;
  dateTo?: string;
  companyId?: string;
  service?: string;
  assignedTo?: string;
  tab?: CommercialTab;
  page?: number;
};

export type LeadListItem = {
  id: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  subject: string | null;
  serviceInterest: string | null;
  source: string;
  status: LeadStatus;
  createdAt: string;
  assignedToName: string | null;
};

export type QuoteListItem = {
  id: string;
  quoteNumber: string;
  companyName: string;
  responsibleName: string | null;
  servicesSummary: string;
  totalAmount: number | null;
  createdAt: string;
  validUntil: string | null;
  status: QuoteStatus;
};

export type ContactListItem = {
  id: string;
  name: string;
  subject: string;
  phone: string;
  company: string | null;
  status: ContactMessageStatus;
  createdAt: string;
};

export type CommercialHistoryItem = {
  id: string;
  entityType: CommercialEntityType;
  entityId: string;
  entityLabel: string;
  action: CommercialHistoryAction;
  fromStatus: string | null;
  toStatus: string | null;
  notes: string | null;
  performedByName: string | null;
  createdAt: string;
};

export type CommercialNoteItem = {
  id: string;
  content: string;
  createdByName: string;
  createdAt: string;
};

export type LeadDetailSerialized = LeadListItem & {
  message: string | null;
  sourcePage: string | null;
  companyId: string | null;
  contactMessageId: string | null;
  convertedQuoteId: string | null;
  notes: CommercialNoteItem[];
  history: CommercialHistoryItem[];
};

export type QuoteItemSerialized = {
  id: string;
  serviceName: string;
  category: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  notes: string | null;
};

export type QuoteDetailSerialized = QuoteListItem & {
  companyId: string | null;
  phone: string | null;
  email: string | null;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  paymentTerms: string | null;
  internalNotes: string | null;
  clientNotes: string | null;
  sourceLeadId: string | null;
  items: QuoteItemSerialized[];
  notes: CommercialNoteItem[];
  history: CommercialHistoryItem[];
};

export type ContactDetailSerialized = ContactListItem & {
  email: string | null;
  message: string;
  source: string;
  sourcePage: string | null;
  serviceInterest: string | null;
  history: CommercialHistoryItem[];
};

const PAGE_SIZE = 15;

export function getCommercialPageSize() {
  return PAGE_SIZE;
}

export function parseDateRange(dateFrom?: string, dateTo?: string) {
  const range: { gte?: Date; lte?: Date } = {};
  if (dateFrom) {
    const d = parseISO(dateFrom);
    if (isValid(d)) range.gte = startOfDay(d);
  }
  if (dateTo) {
    const d = parseISO(dateTo);
    if (isValid(d)) range.lte = endOfDay(d);
  }
  return Object.keys(range).length ? range : undefined;
}

export function buildLeadWhere(filters: CommercialFilters): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = { type: "ORCAMENTO" };
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { serviceInterest: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as LeadStatus;
  }
  if (filters.service) {
    where.serviceInterest = { contains: filters.service, mode: "insensitive" };
  }
  if (filters.companyId) where.companyId = filters.companyId;
  if (filters.assignedTo) where.assignedToUserId = filters.assignedTo;
  if (filters.origem && filters.origem !== "ALL") {
    where.source = filters.origem;
  }
  const createdAt = parseDateRange(filters.dateFrom, filters.dateTo);
  if (createdAt) where.createdAt = createdAt;

  const card = filters.card;
  if (card === "LEAD_NOVO") where.status = "NOVO";
  if (card === "EM_ANALISE") {
    where.OR = [{ status: "EM_ANALISE" }];
  }

  return where;
}

export function buildQuoteWhere(filters: CommercialFilters): Prisma.QuoteWhereInput {
  const where: Prisma.QuoteWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { quoteNumber: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { responsibleName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { items: { some: { serviceName: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as QuoteStatus;
  }
  if (filters.companyId) where.companyId = filters.companyId;
  const createdAt = parseDateRange(filters.dateFrom, filters.dateTo);
  if (createdAt) where.createdAt = createdAt;

  const card = filters.card;
  if (card === "QUOTE_ENVIADO") where.status = "ENVIADO";
  if (card === "QUOTE_AGUARDANDO") where.status = "AGUARDANDO_RESPOSTA";
  if (card === "QUOTE_APROVADO") where.status = "APROVADO";
  if (card === "QUOTE_RECUSADO") where.status = "RECUSADO";

  return where;
}

export function buildContactWhere(filters: CommercialFilters): Prisma.ContactMessageWhereInput {
  const where: Prisma.ContactMessageWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as ContactMessageStatus;
  }
  const createdAt = parseDateRange(filters.dateFrom, filters.dateTo);
  if (createdAt) where.createdAt = createdAt;
  if (filters.card === "CONTACT_NOVO") where.status = "NOVO";
  return where;
}

export function serializeLeadListItem(
  lead: Lead & { assignedTo?: { name: string } | null }
): LeadListItem {
  return {
    id: lead.id,
    name: lead.name,
    companyName: lead.companyName,
    phone: lead.phone,
    email: lead.email,
    subject: lead.serviceTitle ?? lead.interestType,
    serviceInterest: lead.serviceInterest ?? lead.serviceTitle,
    source: lead.source,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
    assignedToName: lead.assignedTo?.name ?? null,
  };
}

export function serializeQuoteListItem(
  quote: Quote & { items: Pick<QuoteItem, "serviceName">[] }
): QuoteListItem {
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    companyName: quote.companyName,
    responsibleName: quote.responsibleName,
    servicesSummary: quote.items.map((i) => i.serviceName).join(", ") || "—",
    totalAmount: quote.totalAmount,
    createdAt: quote.createdAt.toISOString(),
    validUntil: quote.validUntil?.toISOString() ?? null,
    status: quote.status,
  };
}

export function serializeContactListItem(contact: ContactMessage): ContactListItem {
  return {
    id: contact.id,
    name: contact.name,
    subject: contact.subject,
    phone: contact.phone,
    company: contact.company,
    status: contact.status,
    createdAt: contact.createdAt.toISOString(),
  };
}

export async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORC-${year}-`;
  const { prisma } = await import("@/lib/prisma");
  const last = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: prefix } },
    orderBy: { quoteNumber: "desc" },
    select: { quoteNumber: true },
  });
  const lastNum = last ? parseInt(last.quoteNumber.split("-").pop() ?? "0", 10) : 0;
  return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
}

export function calcQuoteTotal(items: { quantity: number; totalPrice?: number | null; unitPrice?: number | null }[]) {
  return items.reduce((sum, item) => {
    if (item.totalPrice != null) return sum + item.totalPrice;
    if (item.unitPrice != null) return sum + item.unitPrice * item.quantity;
    return sum;
  }, 0);
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildQuoteWhatsAppMessage(quote: {
  companyName: string;
  quoteNumber: string;
  items: { serviceName: string }[];
  validUntil: string | null;
  pdfUrl?: string;
}) {
  const services = quote.items.map((i) => i.serviceName).join(", ");
  const validity = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString("pt-BR")
    : "a combinar";
  let msg = `Olá! Segue orçamento da Unimetra para sua empresa.

Empresa: ${quote.companyName}
Orçamento: ${quote.quoteNumber}
Serviços: ${services}
Validade: ${validity}

Podemos seguir com a proposta?`;
  if (quote.pdfUrl) {
    msg += `\n\nVocê pode acessar a proposta pelo link: ${quote.pdfUrl}`;
  }
  return msg;
}

export function buildQuoteEmail(quote: {
  companyName: string;
  responsibleName: string | null;
}) {
  const clinic = getClinicInfo();
  const name = quote.responsibleName ?? "responsável";
  return {
    subject: `Orçamento Unimetra — ${quote.companyName}`,
    body: `Olá, ${name}.

Segue orçamento solicitado para os serviços de Medicina e Segurança do Trabalho.

Ficamos à disposição para dúvidas e ajustes.

${clinic.name}
${clinic.phone ?? ""}`,
  };
}

export function buildLeadWhatsAppMessage(lead: {
  name: string;
  companyName: string | null;
  serviceInterest: string | null;
}) {
  return `Olá, ${lead.name}! Recebemos sua solicitação comercial da ${lead.companyName ?? "sua empresa"}${lead.serviceInterest ? ` sobre ${lead.serviceInterest}` : ""}. Como podemos ajudar?`;
}

export function isQuoteRequestSubject(subject: string) {
  return subject.trim().toLowerCase() === QUOTE_REQUEST_SUBJECT.toLowerCase();
}
