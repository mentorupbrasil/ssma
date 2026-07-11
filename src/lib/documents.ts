import type {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentHistoryAction,
  ClinicalExamType,
  Prisma,
} from "@prisma/client";
import { startOfDay, endOfDay, parseISO, isValid, startOfMonth, endOfMonth } from "date-fns";
import type { UserRole } from "@/types/roles";

export type DocumentFormOptions = {
  companies: Array<{ id: string; legalName: string; tradeName: string | null }>;
  patients: Array<{ id: string; fullName: string; companyId: string | null }>;
  referrals: Array<{
    id: string;
    protocol: string;
    companyId: string;
    patientId: string;
    patient: { fullName: string } | null;
    clinicalExamType: string;
  }>;
  exams: Array<{ id: string; name: string }>;
  quotes: Array<{ id: string; quoteNumber: string | null; companyName: string }>;
};

export const DOCUMENT_KPI_CARDS: {
  key: string;
  filter: string;
  label: string;
  hint: string;
}[] = [
  {
    key: "pendentes_liberacao",
    filter: "PENDENTES_LIBERACAO",
    label: "Pendentes de liberação",
    hint: "ASO ainda não liberado para a empresa",
  },
  {
    key: "liberados",
    filter: "LIBERADOS",
    label: "Liberados",
    hint: "Empresa já pode baixar no portal",
  },
];

/** @deprecated Prefer DOCUMENT_KPI_CARDS no painel clínico */
export const DOCUMENT_STAT_CARDS: { key: string; filter: string; label: string }[] = [
  ...DOCUMENT_KPI_CARDS.map(({ key, filter, label }) => ({ key, filter, label })),
  { key: "aguardando_arquivo", filter: "PENDENTE", label: "Aguardando arquivo" },
  { key: "em_elaboracao", filter: "EM_EMISSAO", label: "Em elaboração" },
  { key: "disponiveis", filter: "DISPONIVEL", label: "Disponíveis" },
  { key: "vencidos", filter: "VENCIDO", label: "Vencidos" },
  { key: "asos_pendentes", filter: "ASO_PENDENTE", label: "ASOs pendentes" },
  { key: "mes", filter: "MES", label: "Documentos do mês" },
];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ASO: "ASO",
  PCMSO: "PCMSO",
  PGR: "PGR",
  LTCAT: "LTCAT",
  PPP: "PPP",
  LAUDO_INSALUBRIDADE: "Laudo de Insalubridade",
  LAUDO_PERICULOSIDADE: "Laudo de Periculosidade",
  RESULTADO_EXAME: "Resultado de Exame",
  GUIA_ENCAMINHAMENTO: "Guia de Encaminhamento",
  CONTRATO: "Contrato",
  PROPOSTA_ORCAMENTO: "Proposta / Orçamento",
  DOCUMENTO_ADMINISTRATIVO: "Documento Administrativo",
  OUTRO: "Outro",
  LAUDO: "Laudo",
  PROPOSTA: "Proposta",
  ENCAMINHAMENTO: "Guia de Encaminhamento",
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Aguardando arquivo",
  EM_EMISSAO: "Em elaboração",
  DISPONIVEL: "Disponível",
  ENVIADO: "Disponível",
  VENCIDO: "Vencido",
  ARQUIVADO: "Arquivado",
  CANCELADO: "Cancelado",
  EM_ELABORACAO: "Em elaboração",
  CONCLUIDO: "Disponível",
  ENTREGUE: "Disponível",
  EM_DIA: "Disponível",
};

export const DOCUMENT_STATUS_FILTER_OPTIONS = [
  { value: "PENDENTE", label: "Aguardando arquivo" },
  { value: "EM_EMISSAO", label: "Em elaboração" },
  { value: "DISPONIVEL", label: "Disponível" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "ARQUIVADO", label: "Arquivado" },
] as const;

export const LGPD_COMPACT_NOTICE =
  "Documentos ocupacionais possuem acesso restrito e devem ser tratados conforme a LGPD.";

export const DOCUMENT_HISTORY_LABELS: Record<DocumentHistoryAction, string> = {
  CREATED: "Documento criado",
  FILE_ATTACHED: "Arquivo anexado",
  FILE_REPLACED: "Arquivo substituído",
  STATUS_CHANGED: "Status alterado",
  DOWNLOADED: "Documento baixado",
  VIEWED: "Documento visualizado",
  SENT: "Documento enviado",
  ARCHIVED: "Documento arquivado",
  PORTAL_ENABLED: "Disponibilizado no portal",
  PORTAL_DISABLED: "Removido do portal",
  DELETED: "Arquivo removido",
};

export const CLINICAL_DOCUMENT_TYPES: DocumentType[] = [
  "ASO",
  "LAUDO_INSALUBRIDADE",
  "LAUDO_PERICULOSIDADE",
  "RESULTADO_EXAME",
  "LAUDO",
];

export const COMMERCIAL_DOCUMENT_TYPES: DocumentType[] = [
  "CONTRATO",
  "PROPOSTA_ORCAMENTO",
  "PROPOSTA",
  "DOCUMENTO_ADMINISTRATIVO",
];

export const PENDING_DOCUMENT_STATUSES: DocumentStatus[] = ["PENDENTE", "EM_EMISSAO"];

export type DocumentListFilters = {
  q?: string;
  card?: string;
  type?: string;
  status?: string;
  companyId?: string;
  patientId?: string;
  referralId?: string;
  dateFrom?: string;
  dateTo?: string;
  validity?: string;
  uploadedBy?: string;
  sensitive?: string;
  sort?: string;
  page?: number;
};

export const LGPD_DEFAULT_NOTICE =
  "Documento confidencial — uso restrito conforme a LGPD (Lei 13.709/2018). O acesso, download e compartilhamento devem ocorrer apenas para finalidades legítimas de Medicina e Segurança do Trabalho.";

export const LGPD_DOWNLOAD_FOOTER =
  "Ao baixar este documento, você declara ciência de que os dados são protegidos pela LGPD e não devem ser compartilhados sem autorização.";

export type DocumentListItem = {
  id: string;
  title: string;
  type: DocumentType;
  fileName: string | null;
  linkLabel: string;
  companyName: string | null;
  patientName: string | null;
  contactPhone: string | null;
  protocol: string | null;
  createdAt: string;
  validUntil: string | null;
  validityLabel: string | null;
  status: DocumentStatus;
  sensitive: boolean;
  hasFile: boolean;
};

export type DocumentHistoryItem = {
  id: string;
  action: DocumentHistoryAction;
  notes: string | null;
  performedByName: string | null;
  createdAt: string;
};

export type DocumentDetailSerialized = DocumentListItem & {
  fileUrl: string | null;
  fileMimeType: string | null;
  fileSize: number | null;
  companyId: string | null;
  patientId: string | null;
  referralId: string | null;
  examId: string | null;
  examName: string | null;
  quoteId: string | null;
  quoteNumber: string | null;
  issuedAt: string | null;
  availableOnPortal: boolean;
  uploadedByName: string | null;
  notes: string | null;
  clientNotes: string | null;
  asoClinicalType: ClinicalExamType | null;
  asoExamDate: string | null;
  asoProfessionalName: string | null;
  history: DocumentHistoryItem[];
};

const PAGE_SIZE = 15;

export function getDocumentPageSize() {
  return PAGE_SIZE;
}

export function normalizeDocumentStatus(status: DocumentStatus): string {
  if (status === "EM_ELABORACAO") return "EM_EMISSAO";
  if (["CONCLUIDO", "EM_DIA"].includes(status)) return "DISPONIVEL";
  if (status === "ENTREGUE") return "ENVIADO";
  return status;
}

/** Status visual: sem arquivo nunca aparece como Disponível. */
export function getDocumentDisplayStatus(doc: {
  status: DocumentStatus;
  hasFile: boolean;
}): { status: string; label: string } {
  const normalized = normalizeDocumentStatus(doc.status);

  if (normalized === "ARQUIVADO") {
    return { status: "ARQUIVADO", label: DOCUMENT_STATUS_LABELS.ARQUIVADO };
  }
  if (normalized === "CANCELADO") {
    return { status: "CANCELADO", label: DOCUMENT_STATUS_LABELS.CANCELADO };
  }
  if (normalized === "VENCIDO") {
    return { status: "VENCIDO", label: DOCUMENT_STATUS_LABELS.VENCIDO };
  }
  if (!doc.hasFile) {
    return { status: "PENDENTE", label: DOCUMENT_STATUS_LABELS.PENDENTE };
  }
  if (normalized === "EM_EMISSAO") {
    return { status: "EM_EMISSAO", label: DOCUMENT_STATUS_LABELS.EM_EMISSAO };
  }
  if (normalized === "ENVIADO" || normalized === "DISPONIVEL") {
    return { status: "DISPONIVEL", label: DOCUMENT_STATUS_LABELS.DISPONIVEL };
  }
  if (normalized === "PENDENTE") {
    return { status: "PENDENTE", label: DOCUMENT_STATUS_LABELS.PENDENTE };
  }
  return {
    status: normalized,
    label: DOCUMENT_STATUS_LABELS[normalized] ?? normalized,
  };
}

export function getDocumentLinkedToLabel(doc: {
  patientName: string | null;
  companyName: string | null;
}): string {
  if (doc.patientName && doc.companyName) {
    return `${doc.patientName} · ${doc.companyName}`;
  }
  return doc.patientName ?? doc.companyName ?? "—";
}

export function computeValidityLabel(
  validUntil: Date | null,
  status: DocumentStatus
): string | null {
  if (!validUntil) return null;
  const now = new Date();
  const days = Math.ceil((validUntil.getTime() - now.getTime()) / 86400000);
  if (status === "VENCIDO" || validUntil < now) return "Vencido";
  if (days <= 30) return "A vencer";
  return "Em dia";
}

export function getLinkLabel(doc: {
  companyId: string | null;
  patientId: string | null;
  referralId: string | null;
  examId: string | null;
  quoteId: string | null;
}): string {
  if (doc.referralId) return "Encaminhamento";
  if (doc.patientId) return "Colaborador";
  if (doc.companyId) return "Empresa";
  if (doc.examId) return "Exame";
  if (doc.quoteId) return "Orçamento";
  return "Avulso";
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

export function buildDocumentWhere(
  filters: DocumentListFilters,
  companyScope?: string,
  options?: { omitProtocolSearch?: boolean }
): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = {};
  if (companyScope) where.companyId = companyScope;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { fileName: { contains: q, mode: "insensitive" } },
      { company: { legalName: { contains: q, mode: "insensitive" } } },
      { company: { tradeName: { contains: q, mode: "insensitive" } } },
      { patient: { fullName: { contains: q, mode: "insensitive" } } },
      ...(options?.omitProtocolSearch
        ? []
        : [{ referral: { protocol: { contains: q, mode: "insensitive" as const } } }]),
    ];
  }

  if (filters.type && filters.type !== "ALL") where.type = filters.type as DocumentType;
  if (filters.status && filters.status !== "ALL") where.status = filters.status as DocumentStatus;
  if (filters.companyId) where.companyId = filters.companyId;
  if (filters.patientId) where.patientId = filters.patientId;
  if (filters.referralId) where.referralId = filters.referralId;
  if (filters.uploadedBy) where.uploadedByUserId = filters.uploadedBy;
  if (filters.sensitive === "true") where.sensitive = true;
  if (filters.sensitive === "false") where.sensitive = false;

  const createdAt = parseDateRange(filters.dateFrom, filters.dateTo);
  if (createdAt) where.createdAt = createdAt;

  if (filters.validity === "vencido") {
    where.validUntil = { lt: new Date() };
    where.status = { not: "ARQUIVADO" };
  } else if (filters.validity === "a_vencer") {
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    where.validUntil = { gte: new Date(), lte: in30 };
  } else if (filters.validity === "em_dia") {
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    where.validUntil = { gt: in30 };
  }

  const card = filters.card;
  if (card === "PENDENTE") where.status = "PENDENTE";
  if (card === "EM_EMISSAO") where.status = { in: ["EM_EMISSAO", "EM_ELABORACAO"] };
  if (card === "DISPONIVEL") {
    where.status = { in: ["DISPONIVEL", "CONCLUIDO", "EM_DIA", "ENVIADO", "ENTREGUE"] };
    where.fileUrl = { not: null };
  }
  if (card === "VENCIDO") where.status = "VENCIDO";
  if (card === "ASO_PENDENTE") {
    where.type = "ASO";
    where.status = { in: ["PENDENTE", "EM_EMISSAO", "EM_ELABORACAO"] };
  }
  if (card === "PENDENTES_LIBERACAO") {
    where.type = "ASO";
    where.status = { notIn: ["ARQUIVADO", "CANCELADO"] };
    const pendingClause: Prisma.DocumentWhereInput = {
      OR: [
        { fileUrl: null },
        {
          status: {
            notIn: ["DISPONIVEL", "CONCLUIDO", "EM_DIA", "ENVIADO", "ENTREGUE"],
          },
        },
      ],
    };
    where.AND = [...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []), pendingClause];
  }
  if (card === "LIBERADOS") {
    where.type = "ASO";
    where.fileUrl = { not: null };
    where.status = { in: ["DISPONIVEL", "CONCLUIDO", "EM_DIA", "ENVIADO", "ENTREGUE"] };
  }
  if (card === "MES") {
    where.createdAt = { gte: startOfMonth(new Date()), lte: endOfMonth(new Date()) };
  }

  // Visão clínica padrão: foco em ASO quando nenhum tipo foi escolhido
  if (!filters.type && !card) {
    where.type = "ASO";
  }

  return where;
}

export function buildDocumentOrderBy(sort?: string): Prisma.DocumentOrderByWithRelationInput[] {
  switch (sort) {
    case "validUntil":
      return [{ validUntil: "asc" }, { createdAt: "desc" }];
    case "status":
      return [{ status: "asc" }, { createdAt: "desc" }];
    case "company":
      return [{ company: { legalName: "asc" } }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

type DocWithRelations = Document & {
  company?: { legalName: string; tradeName: string | null; whatsapp?: string | null; phone?: string | null } | null;
  patient?: { fullName: string } | null;
  referral?: { protocol: string } | null;
};

export function serializeDocumentListItem(doc: DocWithRelations): DocumentListItem {
  return {
    id: doc.id,
    title: doc.title,
    type: doc.type,
    fileName: doc.fileName,
    linkLabel: getLinkLabel(doc),
    companyName: doc.company?.tradeName ?? doc.company?.legalName ?? null,
    patientName: doc.patient?.fullName ?? null,
    contactPhone: doc.company?.whatsapp ?? doc.company?.phone ?? null,
    protocol: doc.referral?.protocol ?? null,
    createdAt: doc.createdAt.toISOString(),
    validUntil: doc.validUntil?.toISOString() ?? null,
    validityLabel: computeValidityLabel(doc.validUntil, doc.status),
    status: doc.status,
    sensitive: doc.sensitive,
    hasFile: !!doc.fileUrl,
  };
}

export function canManageDocuments(role: UserRole): boolean {
  return ["ADMIN", "CLINIC_ADMIN", "RECEPCAO", "RECEPTION", "MEDICO", "HEALTH_PROFESSIONAL", "TECNICO", "SST_TECHNICIAN"].includes(role);
}

export function canViewDocument(
  role: UserRole,
  doc: { sensitive: boolean; type: DocumentType; companyId: string | null; availableOnPortal: boolean },
  userCompanyId?: string | null
): boolean {
  if (role === "ADMIN" || role === "CLINIC_ADMIN") return true;
  if (role === "EMPRESA" || role === "COMPANY_HR") {
    return !!userCompanyId && doc.companyId === userCompanyId;
  }
  if (role === "FINANCEIRO" || role === "FINANCIAL") {
    return COMMERCIAL_DOCUMENT_TYPES.includes(doc.type) && !doc.sensitive;
  }
  if (role === "MEDICO" || role === "HEALTH_PROFESSIONAL" || role === "TECNICO" || role === "SST_TECHNICIAN") return true;
  if (role === "RECEPCAO" || role === "RECEPTION") {
    if (doc.sensitive && CLINICAL_DOCUMENT_TYPES.includes(doc.type)) return false;
    return true;
  }
  return false;
}

export function buildDocumentWhatsAppMessage(doc: {
  title: string;
  type: DocumentType;
  companyName: string | null;
  patientName: string | null;
  protocol: string | null;
}) {
  const ref = doc.patientName ?? doc.companyName ?? "solicitação";
  return `Olá! O documento ${DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type} referente a ${ref} está disponível.

${doc.protocol ? `Protocolo: ${doc.protocol}\n` : ""}Documento: ${doc.title}

Em caso de dúvidas, seguimos à disposição.

${LGPD_DOWNLOAD_FOOTER}`;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ASO_CLINICAL_TYPE_LABELS: Record<ClinicalExamType, string> = {
  ADMISSIONAL: "Admissional",
  DEMISSIONAL: "Demissional",
  PERIODICO: "Periódico",
  MUDANCA_FUNCAO: "Mudança de função",
  RETORNO_TRABALHO: "Retorno ao trabalho",
};
