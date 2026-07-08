import type {
  ReferralStatus,
  ClinicalExamType,
  ReferralSource,
  ReferralExamStatus,
  ReferralDocumentType,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { CLINICAL_EXAM_LABELS, REFERRAL_STATUS_LABELS } from "@/types";

export const REFERRAL_STATUS_TABS: { value: ReferralStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "NOVO", label: "Novos" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "AGUARDANDO_AGENDAMENTO", label: "Aguardando agendamento" },
  { value: "AGENDADO", label: "Agendados" },
  { value: "EM_ATENDIMENTO", label: "Em atendimento" },
  { value: "AGUARDANDO_RESULTADO", label: "Aguardando resultado" },
  { value: "AGUARDANDO_DOCUMENTO", label: "Aguardando documento" },
  { value: "ASO_DISPONIVEL", label: "ASO disponível" },
  { value: "CONCLUIDO", label: "Concluídos" },
  { value: "CANCELADO", label: "Cancelados" },
];

export const REFERRAL_STAT_CARDS: { status: ReferralStatus; label: string }[] = [
  { status: "NOVO", label: "Novos" },
  { status: "EM_ANALISE", label: "Em análise" },
  { status: "AGENDADO", label: "Agendados" },
  { status: "EM_ATENDIMENTO", label: "Em atendimento" },
  { status: "AGUARDANDO_DOCUMENTO", label: "Aguardando documento" },
  { status: "CONCLUIDO", label: "Concluídos" },
];

export const REFERRAL_SOURCE_LABELS: Record<ReferralSource, string> = {
  PORTAL: "Portal empresarial",
  ADMIN: "Painel administrativo",
  PRE_REFERRAL: "Pré-encaminhamento",
  SITE: "Site público",
};

export const REFERRAL_EXAM_STATUS_LABELS = {
  PENDENTE: "Pendente",
  AGENDADO: "Agendado",
  REALIZADO: "Realizado",
  RESULTADO_DISPONIVEL: "Resultado disponível",
  CANCELADO: "Cancelado",
} as const;

export const REFERRAL_DOCUMENT_TYPE_LABELS = {
  ASO: "ASO",
  GUIA: "Guia",
  LAUDO: "Laudo",
  RESULTADO: "Resultado",
  OUTRO: "Outro",
} as const;

export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function buildReferralWhatsAppMessage(params: {
  protocol: string;
  companyName: string;
  employeeName: string;
  clinicalExamType: ClinicalExamType;
  status: ReferralStatus;
  scheduledAt?: Date | null;
  hasAso?: boolean;
}): string {
  const examLabel = CLINICAL_EXAM_LABELS[params.clinicalExamType] ?? params.clinicalExamType;
  const statusLabel = REFERRAL_STATUS_LABELS[params.status] ?? params.status;

  const lines = [
    `Olá! Sobre o encaminhamento ${params.protocol}:`,
    "",
    `Empresa: ${params.companyName}`,
    `Colaborador: ${params.employeeName}`,
    `Tipo de exame: ${examLabel}`,
    `Status atual: ${statusLabel}`,
    "",
    "Estamos acompanhando sua solicitação. Em caso de dúvida, seguimos à disposição.",
  ];

  if (params.scheduledAt) {
    const d = params.scheduledAt;
    const date = d.toLocaleDateString("pt-BR");
    const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    lines.splice(7, 0, `Agendamento: ${date} às ${time}`);
  }

  if (params.hasAso) {
    lines.push(
      "",
      "O documento já está disponível para retirada/download conforme orientação da clínica."
    );
  }

  return lines.join("\n");
}

export type ReferralListFilters = {
  q?: string;
  status?: string;
  companyId?: string;
  clinicalExamType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "status" | "company";
  sortDir?: "asc" | "desc";
};

export function buildReferralWhere(
  filters: ReferralListFilters,
  companyId?: string
): Prisma.ReferralWhereInput {
  const where: Prisma.ReferralWhereInput = {};

  if (companyId) {
    where.companyId = companyId;
  }

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as ReferralStatus;
  }

  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  if (filters.clinicalExamType) {
    where.clinicalExamType = filters.clinicalExamType as ClinicalExamType;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom);
    }
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
      { company: { legalName: { contains: q, mode: "insensitive" } } },
      { company: { tradeName: { contains: q, mode: "insensitive" } } },
      { patient: { fullName: { contains: q, mode: "insensitive" } } },
      ...(digits.length >= 3 ? [{ patient: { cpf: { contains: digits } } }] : []),
    ];
  }

  return where;
}

export type ReferralListItem = {
  id: string;
  protocol: string;
  companyName: string;
  employeeName: string;
  jobTitle: string | null;
  clinicalExamType: ClinicalExamType;
  requestedDate: string;
  scheduledAt: string | null;
  status: ReferralStatus;
  responsibleName: string | null;
  companyPhone: string | null;
  companyWhatsapp: string | null;
};

export type ReferralDetailSerialized = {
  id: string;
  protocol: string;
  status: ReferralStatus;
  clinicalExamType: ClinicalExamType;
  source: ReferralSource;
  requestedDate: string;
  scheduledAt: string | null;
  authorizerName: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  internalNotes: string | null;
  externalSystemReference: string | null;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    legalName: string;
    tradeName: string | null;
    cnpj: string;
    responsibleName: string | null;
    whatsapp: string | null;
    phone: string | null;
    email: string | null;
  };
  employee: {
    id: string;
    fullName: string;
    cpf: string;
    jobTitle: string | null;
    department: string | null;
    notes: string | null;
    phone: string | null;
  };
  assignedTo: { id: string; name: string } | null;
  exams: {
    id: string;
    examName: string;
    category: string;
    status: ReferralExamStatus;
    resultAvailableAt: string | null;
  }[];
  appointments: {
    id: string;
    title: string;
    scheduledAt: string;
    status: string;
    notes: string | null;
  }[];
  documents: {
    id: string;
    type: ReferralDocumentType;
    fileName: string;
    fileUrl: string;
    uploadedByName: string | null;
    createdAt: string;
  }[];
  legacyDocuments: {
    id: string;
    title: string;
    type: string;
    status: string;
    fileUrl: string | null;
  }[];
  statusHistory: {
    id: string;
    fromStatus: ReferralStatus | null;
    toStatus: ReferralStatus;
    notes: string | null;
    changedByName: string | null;
    createdAt: string;
  }[];
  preReferral: { id: string; protocol: string } | null;
};

export function serializeReferralDetail(
  referral: {
    id: string;
    protocol: string;
    status: ReferralStatus;
    clinicalExamType: ClinicalExamType;
    source: ReferralSource;
    requestedDate: Date;
    scheduledAt: Date | null;
    authorizerName: string | null;
    companyPhone: string | null;
    companyEmail: string | null;
    internalNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
    company: {
      id: string;
      legalName: string;
      tradeName: string | null;
      cnpj: string;
      responsibleName: string | null;
      whatsapp: string | null;
      phone: string | null;
      email: string | null;
    };
    patient: {
      id: string;
      fullName: string;
      cpf: string;
      jobTitle: string | null;
      department: string | null;
      notes: string | null;
      phone: string | null;
    };
    assignedTo: { id: string; name: string } | null;
    exams: {
      id: string;
      examName: string;
      category: string;
      status: ReferralExamStatus;
      resultAvailableAt: Date | null;
    }[];
    appointments: {
      id: string;
      title: string;
      scheduledAt: Date;
      status: string;
      notes: string | null;
    }[];
    referralDocuments: {
      id: string;
      type: ReferralDocumentType;
      fileName: string;
      fileUrl: string;
      createdAt: Date;
      uploadedBy: { name: string } | null;
    }[];
    documents: {
      id: string;
      title: string;
      type: string;
      status: string;
      fileUrl: string | null;
    }[];
    statusHistory: {
      id: string;
      fromStatus: ReferralStatus | null;
      toStatus: ReferralStatus;
      notes: string | null;
      createdAt: Date;
      changedBy: { name: string } | null;
    }[];
    preReferral: { id: string; protocol: string } | null;
  }
): ReferralDetailSerialized {
  return {
    id: referral.id,
    protocol: referral.protocol,
    status: referral.status,
    clinicalExamType: referral.clinicalExamType,
    source: referral.source,
    requestedDate: referral.requestedDate.toISOString(),
    scheduledAt: referral.scheduledAt?.toISOString() ?? null,
    authorizerName: referral.authorizerName,
    companyPhone: referral.companyPhone,
    companyEmail: referral.companyEmail,
    internalNotes: referral.internalNotes,
    externalSystemReference: referral.externalSystemReference ?? null,
    createdAt: referral.createdAt.toISOString(),
    updatedAt: referral.updatedAt.toISOString(),
    company: referral.company,
    employee: {
      id: referral.patient.id,
      fullName: referral.patient.fullName,
      cpf: referral.patient.cpf,
      jobTitle: referral.patient.jobTitle,
      department: referral.patient.department,
      notes: referral.patient.notes,
      phone: referral.patient.phone,
    },
    assignedTo: referral.assignedTo,
    exams: referral.exams.map((e) => ({
      id: e.id,
      examName: e.examName,
      category: e.category,
      status: e.status,
      resultAvailableAt: e.resultAvailableAt?.toISOString() ?? null,
    })),
    appointments: referral.appointments.map((a) => ({
      id: a.id,
      title: a.title,
      scheduledAt: a.scheduledAt.toISOString(),
      status: a.status,
      notes: a.notes,
    })),
    documents: referral.referralDocuments.map((d) => ({
      id: d.id,
      type: d.type,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      uploadedByName: d.uploadedBy?.name ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
    legacyDocuments: referral.documents.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      status: d.status,
      fileUrl: d.fileUrl,
    })),
    statusHistory: referral.statusHistory.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      notes: h.notes,
      changedByName: h.changedBy?.name ?? null,
      createdAt: h.createdAt.toISOString(),
    })),
    preReferral: referral.preReferral,
  };
}
