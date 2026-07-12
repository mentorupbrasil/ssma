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
  CommercialStage,
  CommercialFollowUp,
  CommercialFollowUpStatus,
  QuoteRejectReason,
  Prisma,
} from "@prisma/client";
import { startOfDay, endOfDay, parseISO, isValid, startOfMonth, endOfMonth } from "date-fns";
import { getClinicInfo } from "@/lib/helpers";

export type CommercialTab = "oportunidades" | "propostas" | "followups";

export const COMMERCIAL_TAB_ALIASES: Record<string, CommercialTab> = {
  solicitacoes: "oportunidades",
  orcamentos: "propostas",
  contatos: "oportunidades",
  historico: "oportunidades",
  oportunidades: "oportunidades",
  propostas: "propostas",
  followups: "followups",
};

export function resolveCommercialTab(value?: string | null): CommercialTab {
  if (!value) return "oportunidades";
  return COMMERCIAL_TAB_ALIASES[value] ?? "oportunidades";
}

export const COMMERCIAL_KPI_STRIP: {
  key: string;
  filter: string;
  label: string;
  tab: CommercialTab;
}[] = [
  { key: "novos_leads", filter: "NOVOS_LEADS", label: "Novos leads", tab: "oportunidades" },
  {
    key: "followups_atrasados",
    filter: "FOLLOWUPS_ATRASADOS",
    label: "Follow-ups atrasados",
    tab: "followups",
  },
  {
    key: "propostas_aguardando",
    filter: "PROPOSTAS_AGUARDANDO",
    label: "Propostas aguardando resposta",
    tab: "propostas",
  },
  {
    key: "fechados_mes",
    filter: "FECHADOS_MES",
    label: "Clientes fechados no mês",
    tab: "oportunidades",
  },
];

/** @deprecated Prefer COMMERCIAL_KPI_STRIP */
export const COMMERCIAL_KPI_CARDS = COMMERCIAL_KPI_STRIP.map((c) => ({
  ...c,
  hint: c.label,
}));

/** @deprecated Prefer COMMERCIAL_KPI_STRIP */
export const COMMERCIAL_STAT_CARDS = COMMERCIAL_KPI_STRIP.map(({ key, filter, label }) => ({
  key,
  filter,
  label,
}));

export const COMMERCIAL_STAGE_LABELS: Record<CommercialStage, string> = {
  NOVO_LEAD: "Novo lead",
  CONTATO_REALIZADO: "Contato realizado",
  QUALIFICACAO: "Qualificação",
  PROPOSTA_ENVIADA: "Proposta enviada",
  EM_NEGOCIACAO: "Em negociação",
  AGUARDANDO_RETORNO: "Aguardando retorno",
  GANHO: "Ganho",
  PERDIDO: "Perdido",
};

export const COMMERCIAL_STAGES = Object.keys(COMMERCIAL_STAGE_LABELS) as CommercialStage[];

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  site: "Site",
  site_contato: "Formulário do site",
  indicacao: "Indicação",
  whatsapp: "WhatsApp",
  manual: "Manual",
  telefone: "Telefone",
};

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
  ENVIADO: "Enviada",
  AGUARDANDO_RESPOSTA: "Aguardando resposta",
  APROVADO: "Aprovada",
  RECUSADO: "Recusada",
  EXPIRADO: "Vencida",
  CANCELADO: "Cancelada",
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
  STATUS_CHANGED: "Etapa alterada",
  NOTE_ADDED: "Observação adicionada",
  WHATSAPP_OPENED: "WhatsApp aberto",
  EMAIL_SENT: "E-mail enviado",
  QUOTE_CREATED: "Proposta criada",
  QUOTE_SENT: "Proposta enviada",
  QUOTE_APPROVED: "Proposta aprovada",
  QUOTE_REJECTED: "Proposta recusada",
  QUOTE_DUPLICATED: "Proposta duplicada",
  COMPANY_LINKED: "Empresa vinculada",
  REFERRAL_CREATED: "Encaminhamento criado",
  PORTAL_ENABLED: "Portal ativado",
  ARCHIVED: "Arquivado",
};

export const FOLLOW_UP_STATUS_LABELS: Record<CommercialFollowUpStatus, string> = {
  PENDENTE: "Pendente",
  REALIZADO: "Realizado",
  CANCELADO: "Cancelado",
};

export const SUGGESTED_QUOTE_SERVICES = [
  "Exames ocupacionais",
  "Contrato empresarial",
  "PCMSO",
  "PGR",
  "Pacote de serviços",
  "ASO admissional",
  "ASO periódico",
  "ASO demissional",
  "LTCAT",
  "Laudo de insalubridade",
  "Laudo de periculosidade",
  "Exames complementares",
  "Treinamentos",
  "Portal empresarial",
] as const;

export const PENDING_QUOTE_STATUSES: QuoteStatus[] = ["ENVIADO", "AGUARDANDO_RESPOSTA"];

export const OPEN_LEAD_STATUSES: LeadStatus[] = [
  "NOVO",
  "EM_ANALISE",
  "EM_CONTATO",
  "AGUARDANDO_RETORNO",
];

export const OPEN_COMMERCIAL_STAGES: CommercialStage[] = [
  "NOVO_LEAD",
  "CONTATO_REALIZADO",
  "QUALIFICACAO",
  "PROPOSTA_ENVIADA",
  "EM_NEGOCIACAO",
  "AGUARDANDO_RETORNO",
];

export const QUOTE_REQUEST_SUBJECT = "Solicitar orçamento";

export function stageToLeadStatus(stage: CommercialStage): LeadStatus {
  switch (stage) {
    case "NOVO_LEAD":
      return "NOVO";
    case "CONTATO_REALIZADO":
      return "EM_CONTATO";
    case "QUALIFICACAO":
      return "EM_ANALISE";
    case "PROPOSTA_ENVIADA":
      return "PROPOSTA_ENVIADA";
    case "EM_NEGOCIACAO":
      return "EM_ANALISE";
    case "AGUARDANDO_RETORNO":
      return "AGUARDANDO_RETORNO";
    case "GANHO":
      return "FECHADO";
    case "PERDIDO":
      return "PERDIDO";
    default:
      return "NOVO";
  }
}

export function leadStatusToStage(status: LeadStatus): CommercialStage {
  switch (status) {
    case "NOVO":
      return "NOVO_LEAD";
    case "EM_CONTATO":
      return "CONTATO_REALIZADO";
    case "EM_ANALISE":
      return "QUALIFICACAO";
    case "CONVERTIDO_ORCAMENTO":
    case "PROPOSTA_ENVIADA":
      return "PROPOSTA_ENVIADA";
    case "AGUARDANDO_RETORNO":
      return "AGUARDANDO_RETORNO";
    case "FECHADO":
      return "GANHO";
    case "PERDIDO":
    case "EXPIRADO":
    case "ARQUIVADO":
      return "PERDIDO";
    default:
      return "NOVO_LEAD";
  }
}

export type CommercialFilters = {
  q?: string;
  card?: string;
  status?: string;
  stage?: string;
  tipo?: string;
  origem?: string;
  dateFrom?: string;
  dateTo?: string;
  companyId?: string;
  service?: string;
  assignedTo?: string;
  retorno?: string;
  followUpBucket?: "atrasados" | "hoje" | "proximos" | "all";
  tab?: CommercialTab | string;
  page?: number;
  pageSize?: number;
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
  stage: CommercialStage;
  city: string | null;
  nextFollowUpAt: string | null;
  followUpAction: string | null;
  lastContactAt: string | null;
  createdAt: string;
  assignedToName: string | null;
  assignedToUserId: string | null;
  contactMessageId: string | null;
  companyId: string | null;
  linkedQuoteId: string | null;
};

export type QuoteListItem = {
  id: string;
  quoteNumber: string;
  companyName: string;
  responsibleName: string | null;
  servicesSummary: string;
  totalAmount: number | null;
  createdAt: string;
  sentAt: string | null;
  validUntil: string | null;
  status: QuoteStatus;
  sourceLeadId: string | null;
  createdByName: string | null;
};

export type ContactListItem = {
  id: string;
  name: string;
  subject: string;
  phone: string;
  company: string | null;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
};

export type FollowUpListItem = {
  id: string;
  leadId: string;
  dueAt: string;
  action: string;
  status: CommercialFollowUpStatus;
  result: string | null;
  notes: string | null;
  companyName: string | null;
  contactName: string;
  contactPhone: string | null;
  assignedToName: string | null;
  overdue: boolean;
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
  cnpj: string | null;
  estimatedEmployees: number | null;
  lostReason: string | null;
  notes: CommercialNoteItem[];
  history: CommercialHistoryItem[];
  quotes: QuoteListItem[];
  followUps: FollowUpListItem[];
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

const PAGE_SIZE = 25;
export const COMMERCIAL_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export function getCommercialPageSize(value?: number | string) {
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  if (n && (COMMERCIAL_PAGE_SIZE_OPTIONS as readonly number[]).includes(n)) return n;
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
      { serviceTitle: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.stage && filters.stage !== "ALL") {
    where.stage = filters.stage as CommercialStage;
  } else if (filters.status && filters.status !== "ALL") {
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
  if (card === "LEAD_NOVO" || card === "NOVOS_LEADS") where.stage = "NOVO_LEAD";
  if (card === "FECHADOS_MES") {
    const now = new Date();
    where.stage = "GANHO";
    where.updatedAt = { gte: startOfMonth(now), lte: endOfMonth(now) };
  }
  if (card === "EM_ANALISE" || card === "EM_NEGOCIACAO") {
    where.stage = {
      in: ["QUALIFICACAO", "CONTATO_REALIZADO", "AGUARDANDO_RETORNO", "PROPOSTA_ENVIADA", "EM_NEGOCIACAO"],
    };
  }
  if (filters.retorno === "aguardando") {
    where.stage = "AGUARDANDO_RETORNO";
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
  if (filters.assignedTo) where.createdByUserId = filters.assignedTo;
  const createdAt = parseDateRange(filters.dateFrom, filters.dateTo);
  if (createdAt) where.createdAt = createdAt;

  const card = filters.card;
  if (card === "QUOTE_ENVIADO") where.status = "ENVIADO";
  if (card === "QUOTE_AGUARDANDO" || card === "PROPOSTAS_AGUARDANDO") {
    where.status = { in: ["ENVIADO", "AGUARDANDO_RESPOSTA"] };
  }
  if (card === "QUOTE_APROVADO") where.status = "APROVADO";
  if (card === "QUOTE_RECUSADO") where.status = "RECUSADO";

  return where;
}

export function buildFollowUpWhere(filters: CommercialFilters): Prisma.CommercialFollowUpWhereInput {
  const where: Prisma.CommercialFollowUpWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { lead: { name: { contains: q, mode: "insensitive" } } },
      { lead: { companyName: { contains: q, mode: "insensitive" } } },
      { lead: { phone: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (filters.assignedTo) where.assignedToUserId = filters.assignedTo;
  if (filters.status === "REALIZADO") where.status = "REALIZADO";
  else if (filters.status === "CANCELADO") where.status = "CANCELADO";
  else if (filters.status !== "ALL") where.status = "PENDENTE";

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const bucket = filters.followUpBucket ?? (filters.card === "FOLLOWUPS_ATRASADOS" ? "atrasados" : undefined);

  if (bucket === "atrasados" || filters.card === "FOLLOWUPS_ATRASADOS") {
    where.status = "PENDENTE";
    where.dueAt = { lt: todayStart };
  } else if (bucket === "hoje") {
    where.status = "PENDENTE";
    where.dueAt = { gte: todayStart, lte: todayEnd };
  } else if (bucket === "proximos") {
    where.status = "PENDENTE";
    where.dueAt = { gt: todayEnd };
  }

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
  if (filters.card === "CONTACT_NOVO" || filters.retorno === "sem_retorno") {
    where.status = "NOVO";
  }
  return where;
}

export function serializeLeadListItem(
  lead: Lead & {
    assignedTo?: { name: string } | null;
    convertedQuoteId?: string | null;
    sourcedQuotes?: { id: string }[];
  }
): LeadListItem {
  const linkedQuoteId =
    lead.convertedQuoteId ?? lead.sourcedQuotes?.[0]?.id ?? null;
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
    stage: lead.stage ?? leadStatusToStage(lead.status),
    city: lead.city ?? null,
    nextFollowUpAt: lead.nextFollowUpAt?.toISOString() ?? null,
    followUpAction: lead.followUpAction ?? null,
    lastContactAt: lead.lastContactAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    assignedToName: lead.assignedTo?.name ?? null,
    assignedToUserId: lead.assignedToUserId ?? null,
    contactMessageId: lead.contactMessageId ?? null,
    companyId: lead.companyId ?? null,
    linkedQuoteId,
  };
}

export function serializeQuoteListItem(
  quote: Quote & {
    items: Pick<QuoteItem, "serviceName">[];
    createdBy?: { name: string } | null;
  }
): QuoteListItem {
  const draftLike = quote.status === "RASCUNHO" || quote.status === "EM_ANALISE";
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    companyName: quote.companyName,
    responsibleName: quote.responsibleName,
    servicesSummary: quote.items.map((i) => i.serviceName).join(", ") || "—",
    totalAmount: quote.totalAmount,
    createdAt: quote.createdAt.toISOString(),
    sentAt: draftLike ? null : quote.updatedAt.toISOString(),
    validUntil: quote.validUntil?.toISOString() ?? null,
    status: quote.status,
    sourceLeadId: quote.sourceLeadId ?? null,
    createdByName: quote.createdBy?.name ?? null,
  };
}

export function serializeFollowUpListItem(
  row: CommercialFollowUp & {
    lead: Pick<Lead, "id" | "name" | "companyName" | "phone">;
    assignedTo?: { name: string } | null;
  }
): FollowUpListItem {
  const due = row.dueAt;
  const overdue = row.status === "PENDENTE" && due < startOfDay(new Date());
  return {
    id: row.id,
    leadId: row.leadId,
    dueAt: due.toISOString(),
    action: row.action,
    status: row.status,
    result: row.result,
    notes: row.notes,
    companyName: row.lead.companyName,
    contactName: row.lead.name,
    contactPhone: row.lead.phone,
    assignedToName: row.assignedTo?.name ?? null,
    overdue,
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
    updatedAt: contact.updatedAt.toISOString(),
  };
}

/** Remove duplicatas visuais da mesma solicitação comercial. */
export function dedupeLeadListItems(items: LeadListItem[]): LeadListItem[] {
  const seen = new Set<string>();
  const result: LeadListItem[] = [];
  for (const item of items) {
    const phone = (item.phone ?? "").replace(/\D/g, "");
    const key = item.contactMessageId
      ? `cm:${item.contactMessageId}`
      : `fp:${phone}|${(item.email ?? "").toLowerCase()}|${(item.companyName ?? "").toLowerCase()}|${(item.serviceInterest ?? "").toLowerCase()}`;
    if (key !== "fp:|||" && seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export const CONTACT_STATUS_LABELS: Record<ContactMessageStatus, string> = {
  NOVO: "Sem retorno",
  EM_ANALISE: "Em análise",
  RESPONDIDO: "Respondido",
  ARQUIVADO: "Arquivado",
};

export const QUOTE_STATUS_FILTER_OPTIONS = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADO", label: "Enviada" },
  { value: "AGUARDANDO_RESPOSTA", label: "Aguardando resposta" },
  { value: "APROVADO", label: "Aprovada" },
  { value: "RECUSADO", label: "Recusada" },
  { value: "EXPIRADO", label: "Vencida" },
] as const;

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
    return sum + 0;
  }, 0);
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function sourceLabel(source: string) {
  return LEAD_SOURCE_LABELS[source] ?? source;
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
  let msg = `Olá! Segue proposta da Unimetra para sua empresa.

Empresa: ${quote.companyName}
Proposta: ${quote.quoteNumber}
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
    subject: `Proposta Unimetra — ${quote.companyName}`,
    body: `Olá, ${name}.

Segue proposta comercial para os serviços de Medicina e Segurança do Trabalho.

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
