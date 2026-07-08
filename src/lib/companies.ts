import type {
  CompanyStatus,
  CompanySize,
  CompanyContractType,
  CompanyContactType,
  CompanyHistoryAction,
  DocumentStatus,
  LeadStatus,
  ReferralStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";
import { maskCpf } from "@/lib/referrals";

export const COMPANY_STAT_CARDS: { key: string; filter: string; label: string }[] = [
  { key: "ativas", filter: "ATIVA", label: "Empresas ativas" },
  { key: "inativas", filter: "INATIVA", label: "Empresas inativas" },
  { key: "docs_pendentes", filter: "DOCS_PENDING", label: "Com documentos pendentes" },
  { key: "ref_abertos", filter: "REFERRALS_OPEN", label: "Com encaminhamentos em aberto" },
  { key: "orc_pendentes", filter: "QUOTES_PENDING", label: "Com orçamento pendente" },
];

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  ATIVA: "Ativa",
  INATIVA: "Inativa",
  PENDENTE: "Pendente",
  BLOQUEADA: "Bloqueada",
};

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  PEQUENA: "Pequena",
  MEDIA: "Média",
  GRANDE: "Grande",
};

export const COMPANY_CONTRACT_LABELS: Record<CompanyContractType, string> = {
  AVULSO: "Avulso",
  MENSAL: "Mensal",
  ANUAL: "Anual",
  EM_NEGOCIACAO: "Em negociação",
};

export const COMPANY_CONTACT_TYPE_LABELS: Record<CompanyContactType, string> = {
  SITE: "Site",
  WHATSAPP: "WhatsApp",
  TELEFONE: "Telefone",
  EMAIL: "E-mail",
  VISITA: "Visita",
  COMERCIAL: "Comercial",
  OUTRO: "Outro",
};

export const COMPANY_HISTORY_ACTION_LABELS: Record<CompanyHistoryAction, string> = {
  CREATED: "Empresa cadastrada",
  UPDATED: "Dados editados",
  STATUS_CHANGED: "Status alterado",
  EMPLOYEE_ADDED: "Colaborador adicionado",
  REFERRAL_CREATED: "Encaminhamento criado",
  QUOTE_SENT: "Orçamento enviado",
  DOCUMENT_ATTACHED: "Documento anexado",
  PORTAL_ENABLED: "Portal ativado",
  PORTAL_DISABLED: "Portal desativado",
  USER_CREATED: "Usuário criado",
  CONTACT_ADDED: "Contato registrado",
};

export const COMPANY_DOCUMENT_SUMMARY_LABELS = {
  EM_DIA: "Em dia",
  PENDENTE: "Pendente",
  VENCIDO: "Vencido",
  NONE: "Não informado",
} as const;

export const LEAD_STATUS_EXTENDED_LABELS: Record<LeadStatus, string> = {
  NOVO: "Novo",
  EM_CONTATO: "Em análise",
  PROPOSTA_ENVIADA: "Enviado",
  FECHADO: "Aprovado",
  PERDIDO: "Recusado",
  EXPIRADO: "Expirado",
};

export const OPEN_REFERRAL_STATUSES: ReferralStatus[] = [
  "NOVO",
  "EM_ANALISE",
  "AGUARDANDO_AGENDAMENTO",
  "AGENDADO",
  "EM_ATENDIMENTO",
  "AGUARDANDO_RESULTADO",
  "AGUARDANDO_DOCUMENTO",
  "ASO_DISPONIVEL",
];

export const PENDING_LEAD_STATUSES: LeadStatus[] = ["NOVO", "EM_CONTATO", "PROPOSTA_ENVIADA"];

export type CompanyListFilters = {
  q?: string;
  status?: string;
  city?: string;
  size?: string;
  contractType?: string;
  pending?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "legalName" | "status" | "createdAt";
  sortDir?: "asc" | "desc";
};

export function buildCompanyWhere(filters: CompanyListFilters): Prisma.CompanyWhereInput {
  const where: Prisma.CompanyWhereInput = {};

  if (filters.status && filters.status !== "ALL") {
    if (filters.status === "DOCS_PENDING") {
      where.documents = { some: { status: { in: ["PENDENTE", "EM_ELABORACAO", "VENCIDO"] } } };
    } else if (filters.status === "REFERRALS_OPEN") {
      where.referrals = { some: { status: { in: OPEN_REFERRAL_STATUSES } } };
    } else if (filters.status === "QUOTES_PENDING") {
      where.leads = { some: { status: { in: PENDING_LEAD_STATUSES } } };
    } else {
      where.status = filters.status as CompanyStatus;
    }
  }

  if (filters.city?.trim()) {
    where.city = { contains: filters.city.trim(), mode: "insensitive" };
  }

  if (filters.size) {
    where.size = filters.size as CompanySize;
  }

  if (filters.contractType) {
    where.contractType = filters.contractType as CompanyContractType;
  }

  if (filters.pending === "true") {
    where.OR = [
      { documents: { some: { status: { in: ["PENDENTE", "VENCIDO"] } } } },
      { referrals: { some: { status: { in: OPEN_REFERRAL_STATUSES } } } },
      { leads: { some: { status: { in: PENDING_LEAD_STATUSES } } } },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom && isValid(parseISO(filters.dateFrom))) {
      where.createdAt.gte = startOfDay(parseISO(filters.dateFrom));
    }
    if (filters.dateTo && isValid(parseISO(filters.dateTo))) {
      where.createdAt.lte = endOfDay(parseISO(filters.dateTo));
    }
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const digits = q.replace(/\D/g, "");
    where.OR = [
      { legalName: { contains: q, mode: "insensitive" } },
      { tradeName: { contains: q, mode: "insensitive" } },
      { responsibleName: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      ...(digits.length >= 3
        ? [
            { cnpj: { contains: digits } },
            { phone: { contains: digits } },
            { whatsapp: { contains: digits } },
          ]
        : []),
    ];
  }

  return where;
}

export function computeDocumentSummary(
  documents: { status: DocumentStatus; validUntil: Date | null }[]
): keyof typeof COMPANY_DOCUMENT_SUMMARY_LABELS {
  if (documents.length === 0) return "NONE";
  const now = new Date();
  const hasExpired = documents.some(
    (d) =>
      d.status === "VENCIDO" ||
      (d.validUntil && d.validUntil < now && d.status !== "ARQUIVADO")
  );
  if (hasExpired) return "VENCIDO";
  const hasPending = documents.some((d) =>
    ["PENDENTE", "EM_ELABORACAO"].includes(d.status)
  );
  if (hasPending) return "PENDENTE";
  return "EM_DIA";
}

export type CompanyListItem = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  responsibleName: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  status: CompanyStatus;
  employeeCount: number;
  referralCount: number;
  documentSummary: keyof typeof COMPANY_DOCUMENT_SUMMARY_LABELS;
  openReferrals: number;
};

export function serializeCompanyListItem(
  c: Prisma.CompanyGetPayload<{
    include: {
      _count: { select: { patients: true; referrals: true; documents: true } };
      documents: { select: { status: true; validUntil: true } };
      referrals: { where: { status: { in: ReferralStatus[] } }; select: { id: true } };
    };
  }>
): CompanyListItem {
  return {
    id: c.id,
    legalName: c.legalName,
    tradeName: c.tradeName,
    cnpj: c.cnpj,
    responsibleName: c.responsibleName,
    whatsapp: c.whatsapp,
    city: c.city,
    state: c.state,
    status: c.status,
    employeeCount: c._count.patients,
    referralCount: c._count.referrals,
    documentSummary: computeDocumentSummary(c.documents),
    openReferrals: c.referrals.length,
  };
}

export type CompanyDetailSerialized = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  stateRegistration: string | null;
  size: CompanySize | null;
  segment: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  responsibleName: string | null;
  responsibleRole: string | null;
  contractType: CompanyContractType | null;
  portalEnabled: boolean;
  status: CompanyStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    employees: number;
    openReferrals: number;
    upcomingAppointments: number;
    pendingDocuments: number;
    pendingQuotes: number;
    lastAppointmentAt: string | null;
  };
  employees: {
    id: string;
    fullName: string;
    cpf: string;
    jobTitle: string | null;
    department: string | null;
    status: string;
    lastReferralAt: string | null;
  }[];
  referrals: {
    id: string;
    protocol: string;
    employeeName: string;
    clinicalExamType: string;
    createdAt: string;
    scheduledAt: string | null;
    status: string;
  }[];
  appointments: {
    id: string;
    scheduledAt: string;
    employeeName: string | null;
    clinicalExamType: string | null;
    status: string;
    protocol: string | null;
  }[];
  documents: {
    id: string;
    title: string;
    type: string;
    status: string;
    validUntil: string | null;
    createdAt: string;
    fileUrl: string | null;
  }[];
  quotes: {
    id: string;
    quoteNumber: string | null;
    serviceTitle: string | null;
    estimatedValue: number | null;
    status: string;
    createdAt: string;
    validUntil: string | null;
  }[];
  contacts: {
    id: string;
    type: string;
    title: string | null;
    notes: string;
    performedByName: string | null;
    createdAt: string;
  }[];
  portalUsers: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  }[];
  history: {
    id: string;
    action: CompanyHistoryAction;
    notes: string | null;
    performedByName: string | null;
    createdAt: string;
  }[];
  siteMessages: {
    id: string;
    name: string;
    subject: string;
    status: string;
    createdAt: string;
  }[];
};

export function buildCompanyWhatsAppMessage(
  companyName: string,
  variant: "default" | "document" | "referral" = "default"
): string {
  if (variant === "document") {
    return `Olá! Identificamos uma pendência relacionada aos documentos ocupacionais da empresa ${companyName}. Podemos seguir com a regularização?`;
  }
  if (variant === "referral") {
    return `Olá! Sobre os encaminhamentos ocupacionais da empresa ${companyName}, podemos confirmar alguns dados?`;
  }
  return `Olá! Aqui é da Unimetra. Estamos entrando em contato sobre os atendimentos ocupacionais da empresa ${companyName}.`;
}

export function canManageCompanies(role: string): boolean {
  return ["ADMIN", "RECEPCAO", "FINANCEIRO"].includes(role);
}

export function canEditCompanyCommercial(role: string): boolean {
  return ["ADMIN", "FINANCEIRO"].includes(role);
}

export function canEditCompanyBasic(role: string): boolean {
  return ["ADMIN", "RECEPCAO", "FINANCEIRO"].includes(role);
}

export { maskCpf };
