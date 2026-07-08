import type {
  PreReferralStatus,
  PreReferralClinicalExamType,
  ExamSelectionMode,
} from "@prisma/client";
import {
  PRE_REFERRAL_STATUS_LABELS,
  PRE_REFERRAL_CLINICAL_EXAM_LABELS,
} from "@/types";
import { maskCpf } from "@/lib/referrals";

export const PRE_REFERRAL_STAT_CARDS: { status: PreReferralStatus; label: string }[] = [
  { status: "NOVO", label: "Novos" },
  { status: "EM_ANALISE", label: "Em análise" },
  { status: "AGUARDANDO_RETORNO", label: "Aguardando retorno" },
  { status: "CONVERTIDO", label: "Convertidos" },
  { status: "CANCELADO", label: "Cancelados" },
];

export const PRE_REFERRAL_STATUS_TABS: { value: PreReferralStatus | "ALL" | "QUEUE"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "NOVO", label: "Novos" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "AGUARDANDO_RETORNO", label: "Aguardando retorno" },
  { value: "CONVERTIDO", label: "Convertidos" },
  { value: "CANCELADO", label: "Cancelados" },
  { value: "DUPLICADO", label: "Duplicados" },
];

export const PRE_REFERRAL_QUEUE_STATUSES: PreReferralStatus[] = [
  "NOVO",
  "EM_ANALISE",
  "AGUARDANDO_RETORNO",
];

export const PRE_REFERRAL_SOURCE_LABELS: Record<string, string> = {
  site_pre_referral: "Site / formulário público",
  site: "Site",
};

export const PRE_REFERRAL_HISTORY_ACTION_LABELS: Record<string, string> = {
  RECEIVED: "Solicitação recebida",
  STATUS_CHANGED: "Status alterado",
  WHATSAPP: "WhatsApp acionado",
  INTERNAL_NOTE: "Observação interna",
  CONVERTED: "Convertido em encaminhamento",
  CANCELLED: "Solicitação cancelada",
};

export type PreReferralListItem = {
  id: string;
  protocol: string;
  companyName: string;
  responsibleName: string;
  employeeName: string;
  employeeRole: string;
  clinicalExamType: string;
  whatsapp: string;
  email: string | null;
  status: PreReferralStatus;
  source: string;
  createdAt: string;
};

export type PreReferralListFilters = {
  q?: string;
  status?: string;
  queue?: string;
  dateFrom?: string;
  dateTo?: string;
  clinicalExamType?: string;
  source?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "status" | "company";
  sortDir?: "asc" | "desc";
};

export type PreReferralDetailSerialized = {
  id: string;
  protocol: string;
  status: PreReferralStatus;
  source: string;
  companyName: string;
  companyDocument: string | null;
  responsibleName: string;
  whatsapp: string;
  email: string | null;
  employeeName: string;
  employeeDocument: string | null;
  employeeRole: string;
  clinicalExamType: PreReferralClinicalExamType;
  examSelectionMode: ExamSelectionMode;
  selectedExams: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string } | null;
  convertedReferral: { id: string; protocol: string } | null;
  history: {
    id: string;
    action: string;
    fromStatus: PreReferralStatus | null;
    toStatus: PreReferralStatus | null;
    notes: string | null;
    performedByName: string | null;
    createdAt: string;
  }[];
};

export function buildPreReferralWhere(filters: PreReferralListFilters) {
  const where: {
    status?: PreReferralStatus | { in: PreReferralStatus[] };
    clinicalExamType?: PreReferralClinicalExamType;
    source?: string;
    createdAt?: { gte?: Date; lte?: Date };
    OR?: Array<Record<string, unknown>>;
  } = {};

  if (filters.queue === "active") {
    where.status = { in: PRE_REFERRAL_QUEUE_STATUSES };
  } else if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as PreReferralStatus;
  }

  if (filters.clinicalExamType) {
    where.clinicalExamType = filters.clinicalExamType as PreReferralClinicalExamType;
  }

  if (filters.source) {
    where.source = filters.source;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const digits = q.replace(/\D/g, "");
    where.OR = [
      { protocol: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { responsibleName: { contains: q, mode: "insensitive" } },
      { employeeName: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: digits.length >= 8 ? digits : q } },
      ...(digits.length >= 3
        ? [
            { companyDocument: { contains: digits } },
            { employeeDocument: { contains: digits } },
          ]
        : []),
    ];
  }

  return where;
}

export function maskDocument(doc: string | null | undefined): string {
  if (!doc) return "—";
  const digits = doc.replace(/\D/g, "");
  if (digits.length === 11) return maskCpf(digits);
  if (digits.length === 14) {
    return `**.***.***/${digits.slice(8, 12)}-**`;
  }
  return doc;
}

export function getMissingPreReferralFields(item: {
  companyDocument?: string | null;
  employeeDocument?: string | null;
  email?: string | null;
  employeeRole?: string | null;
}): string[] {
  const missing: string[] = [];
  if (!item.companyDocument?.trim()) missing.push("CNPJ/CPF da empresa");
  if (!item.employeeDocument?.trim()) missing.push("CPF do colaborador");
  if (!item.email?.trim()) missing.push("e-mail de contato");
  if (!item.employeeRole?.trim()) missing.push("função do colaborador");
  return missing;
}

export function buildPreReferralWhatsAppMessage(params: {
  protocol: string;
  companyName: string;
  employeeName: string;
  clinicalExamType: PreReferralClinicalExamType;
  missingFields?: string[];
}): string {
  const examLabel =
    PRE_REFERRAL_CLINICAL_EXAM_LABELS[params.clinicalExamType] ?? params.clinicalExamType;

  const lines = [
    "Olá! Recebemos sua solicitação de pré-encaminhamento pelo site da Unimetra.",
    "",
    `Protocolo: ${params.protocol}`,
    `Empresa: ${params.companyName}`,
    `Colaborador: ${params.employeeName}`,
    `Tipo de exame: ${examLabel}`,
    "",
    "Para seguirmos com o atendimento, precisamos confirmar alguns dados. Podemos continuar por aqui?",
  ];

  if (params.missingFields && params.missingFields.length > 0) {
    lines.push("", `Precisamos confirmar: ${params.missingFields.join(", ")}.`);
  }

  return lines.join("\n");
}

export function serializePreReferralDetail(
  item: {
    id: string;
    protocol: string;
    status: PreReferralStatus;
    source: string;
    companyName: string;
    companyDocument: string | null;
    responsibleName: string;
    whatsapp: string;
    email: string | null;
    employeeName: string;
    employeeDocument: string | null;
    employeeRole: string;
    clinicalExamType: PreReferralClinicalExamType;
    examSelectionMode: ExamSelectionMode;
    selectedExams: string[];
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    assignedTo: { id: string; name: string } | null;
    convertedReferralId: string | null;
    referral: { id: string; protocol: string } | null;
    history: {
      id: string;
      action: string;
      fromStatus: PreReferralStatus | null;
      toStatus: PreReferralStatus | null;
      notes: string | null;
      createdAt: Date;
      performedBy: { name: string } | null;
    }[];
  }
): PreReferralDetailSerialized {
  const converted =
    item.referral ??
    (item.convertedReferralId
      ? { id: item.convertedReferralId, protocol: "" }
      : null);

  return {
    id: item.id,
    protocol: item.protocol,
    status: item.status,
    source: item.source,
    companyName: item.companyName,
    companyDocument: item.companyDocument,
    responsibleName: item.responsibleName,
    whatsapp: item.whatsapp,
    email: item.email,
    employeeName: item.employeeName,
    employeeDocument: item.employeeDocument,
    employeeRole: item.employeeRole,
    clinicalExamType: item.clinicalExamType,
    examSelectionMode: item.examSelectionMode,
    selectedExams: item.selectedExams,
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    assignedTo: item.assignedTo,
    convertedReferral: converted,
    history: item.history.map((h) => ({
      id: h.id,
      action: h.action,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      notes: h.notes,
      performedByName: h.performedBy?.name ?? null,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}
