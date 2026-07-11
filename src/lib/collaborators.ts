import type { PatientStatus, PatientHistoryAction, ClinicalExamType } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { startOfDay, endOfDay, parseISO, isValid, addDays } from "date-fns";
import { maskCpf } from "@/lib/referrals";
import { formatCPF } from "@/lib/helpers";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documents";

export const COLLABORATOR_STAT_CARDS: { key: string; filter: string; label: string }[] = [
  { key: "ativos", filter: "ATIVO", label: "Colaboradores ativos" },
  { key: "inativos", filter: "INATIVO", label: "Inativos" },
  { key: "agendados", filter: "SCHEDULED", label: "Com exame agendado" },
  { key: "docs_pendentes", filter: "DOCS_PENDING", label: "Com documentos pendentes" },
  { key: "periodico_vencer", filter: "PERIODIC_DUE", label: "Com periódico a vencer" },
  { key: "sem_empresa", filter: "NO_COMPANY", label: "Sem empresa vinculada" },
];

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  AFASTADO: "Afastado",
  DESLIGADO: "Desligado",
  PENDENTE: "Pendente",
};

export const PATIENT_HISTORY_ACTION_LABELS: Record<PatientHistoryAction, string> = {
  CREATED: "Colaborador cadastrado",
  UPDATED: "Dados editados",
  STATUS_CHANGED: "Status alterado",
  REFERRAL_CREATED: "Encaminhamento criado",
  APPOINTMENT_SCHEDULED: "Exame agendado",
  ATTENDANCE_STARTED: "Atendimento iniciado",
  ATTENDANCE_COMPLETED: "Atendimento concluído",
  DOCUMENT_ATTACHED: "Documento anexado",
  ASO_AVAILABLE: "ASO disponibilizado",
  COMPANY_LINKED: "Vínculo com empresa",
};

export type CollaboratorListFilters = {
  q?: string;
  status?: string;
  companyId?: string;
  jobTitle?: string;
  department?: string;
  clinicalExamType?: string;
  dateFrom?: string;
  dateTo?: string;
  periodicDue?: string;
  docsPending?: string;
  page?: number;
  pageSize?: number;
};

const OPEN_REFERRAL_STATUSES = [
  "NOVO",
  "EM_ANALISE",
  "AGUARDANDO_AGENDAMENTO",
  "AGENDADO",
  "EM_ATENDIMENTO",
  "AGUARDANDO_RESULTADO",
  "AGUARDANDO_DOCUMENTO",
  "ASO_DISPONIVEL",
] as const;

export function buildCollaboratorWhere(
  filters: CollaboratorListFilters,
  companyId?: string
): Prisma.PatientWhereInput {
  const where: Prisma.PatientWhereInput = {};

  if (companyId) {
    where.companyId = companyId;
  }

  if (filters.status && filters.status !== "ALL") {
    if (filters.status === "SCHEDULED") {
      where.appointments = {
        some: {
          scheduledAt: { gte: new Date() },
          status: { in: ["AGENDADO", "CONFIRMADO"] },
        },
      };
    } else if (filters.status === "DOCS_PENDING") {
      where.documents = { some: { status: { in: ["PENDENTE", "EM_EMISSAO", "EM_ELABORACAO", "VENCIDO"] } } };
    } else if (filters.status === "PERIODIC_DUE") {
      const in30 = addDays(new Date(), 30);
      where.OR = [
        { nextPeriodicDate: { lte: in30 } },
        {
          referrals: {
            some: { clinicalExamType: "PERIODICO", status: { in: [...OPEN_REFERRAL_STATUSES] } },
          },
        },
      ];
    } else if (filters.status === "NO_COMPANY") {
      where.companyId = null;
    } else {
      where.status = filters.status as PatientStatus;
    }
  }

  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  if (filters.jobTitle?.trim()) {
    where.jobTitle = { contains: filters.jobTitle.trim(), mode: "insensitive" };
  }

  if (filters.department?.trim()) {
    where.department = { contains: filters.department.trim(), mode: "insensitive" };
  }

  if (filters.clinicalExamType) {
    where.referrals = { some: { clinicalExamType: filters.clinicalExamType as ClinicalExamType } };
  }

  if (filters.docsPending === "true") {
    where.documents = { some: { status: { in: ["PENDENTE", "EM_EMISSAO", "EM_ELABORACAO", "VENCIDO"] } } };
  }

  if (filters.periodicDue === "true") {
    where.nextPeriodicDate = { lte: addDays(new Date(), 30) };
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
      { fullName: { contains: q, mode: "insensitive" } },
      { jobTitle: { contains: q, mode: "insensitive" } },
      { department: { contains: q, mode: "insensitive" } },
      { company: { legalName: { contains: q, mode: "insensitive" } } },
      { company: { tradeName: { contains: q, mode: "insensitive" } } },
      { referrals: { some: { protocol: { contains: q, mode: "insensitive" } } } },
      ...(digits.length >= 3 ? [{ cpf: { contains: digits } }] : []),
    ];
  }

  return where;
}

export type CollaboratorListItem = {
  id: string;
  fullName: string;
  cpfMasked: string;
  cpfFormatted: string;
  companyId: string | null;
  companyName: string | null;
  jobTitle: string | null;
  department: string | null;
  status: PatientStatus;
  lastExamLabel: string | null;
  lastExamDate: string | null;
  nextPeriodicDate: string | null;
  hasPendingDocs: boolean;
  pendingDocsCount: number;
};

export function serializeCollaboratorListItem(
  p: Prisma.PatientGetPayload<{
    include: {
      company: true;
      referrals: { orderBy: { createdAt: "desc" }; take: 1 };
      documents: { where: { status: { in: ["PENDENTE", "EM_EMISSAO", "EM_ELABORACAO", "VENCIDO"] } }; take: 1 };
    };
  }>
): CollaboratorListItem {
  const lastRef = p.referrals[0];
  return {
    id: p.id,
    fullName: p.fullName,
    cpfMasked: maskCpf(p.cpf),
    cpfFormatted: formatCPF(p.cpf),
    companyId: p.companyId,
    companyName: p.company ? (p.company.tradeName ?? p.company.legalName) : null,
    jobTitle: p.jobTitle,
    department: p.department,
    status: p.status,
    lastExamLabel: lastRef
      ? CLINICAL_EXAM_LABELS[lastRef.clinicalExamType] ?? lastRef.clinicalExamType
      : null,
    lastExamDate: lastRef?.createdAt.toISOString() ?? null,
    nextPeriodicDate: p.nextPeriodicDate?.toISOString() ?? null,
    hasPendingDocs: p.documents.length > 0,
    pendingDocsCount: p.documents.length,
  };
}

export type CollaboratorDetailSerialized = {
  id: string;
  fullName: string;
  cpf: string;
  cpfMasked: string;
  rg: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  jobTitle: string | null;
  department: string | null;
  admissionDate: string | null;
  nextPeriodicDate: string | null;
  status: PatientStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    legalName: string;
    tradeName: string | null;
  } | null;
  stats: {
    openReferrals: number;
    upcomingAppointments: number;
    availableDocuments: number;
    pendingExams: number;
    lastExamLabel: string | null;
    lastExamDate: string | null;
  };
  referrals: {
    id: string;
    protocol: string;
    companyName: string;
    clinicalExamType: string;
    createdAt: string;
    scheduledAt: string | null;
    status: string;
  }[];
  appointments: {
    id: string;
    scheduledAt: string;
    clinicalExamType: string | null;
    companyName: string | null;
    status: string;
    protocol: string | null;
  }[];
  clinicalExams: {
    id: string;
    name: string;
    date: string;
    status: string;
    protocol: string | null;
  }[];
  complementaryExams: {
    id: string;
    name: string;
    date: string;
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
  history: {
    id: string;
    action: PatientHistoryAction;
    notes: string | null;
    performedByName: string | null;
    createdAt: string;
  }[];
};

export function getPeriodicExamBadge(nextPeriodicDate: string | null): {
  label: string;
  tone: "ok" | "warning" | "danger" | "neutral";
} {
  if (!nextPeriodicDate) {
    return { label: "Periodicidade não definida", tone: "neutral" };
  }
  const due = new Date(nextPeriodicDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return { label: "Periódico vencido", tone: "danger" };
  if (diffDays <= 30) return { label: `Periódico em ${diffDays}d`, tone: "warning" };
  return { label: "Periódico em dia", tone: "ok" };
}

export type CollaboratorTimelineEvent = {
  id: string;
  kind: string;
  title: string;
  subtitle?: string;
  createdAt: string;
  badgeStatus?: string;
  badgeType?: "referral" | "appointment" | "document" | "collaborator";
};

const TIMELINE_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  ASO: "Atestado de saúde ocupacional",
};

function timelineDocumentTypeLabel(type: string): string {
  return TIMELINE_DOCUMENT_TYPE_LABELS[type] ?? DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS] ?? type;
}

export function buildCollaboratorTimeline(collaborator: {
  history: { id: string; action: string; notes: string | null; performedByName: string | null; createdAt: string }[];
  referrals: { id: string; protocol: string; clinicalExamType: string; createdAt: string; status: string }[];
  appointments: { id: string; scheduledAt: string; clinicalExamType: string | null; status: string }[];
  documents: { id: string; title: string; type: string; createdAt: string }[];
}): CollaboratorTimelineEvent[] {
  const events: CollaboratorTimelineEvent[] = [];

  for (const h of collaborator.history) {
    events.push({
      id: `h-${h.id}`,
      kind: "history",
      title: PATIENT_HISTORY_ACTION_LABELS[h.action as keyof typeof PATIENT_HISTORY_ACTION_LABELS] ?? h.action,
      subtitle: h.performedByName ? `Por ${h.performedByName}` : h.notes ?? undefined,
      createdAt: h.createdAt,
    });
  }
  for (const r of collaborator.referrals) {
    events.push({
      id: `r-${r.id}`,
      kind: "referral",
      title: `Encaminhamento ${r.protocol}`,
      badgeStatus: r.status,
      badgeType: "referral",
      createdAt: r.createdAt,
    });
  }
  for (const a of collaborator.appointments) {
    const examLabel = a.clinicalExamType
      ? CLINICAL_EXAM_LABELS[a.clinicalExamType as keyof typeof CLINICAL_EXAM_LABELS] ??
        a.clinicalExamType
      : undefined;
    events.push({
      id: `a-${a.id}`,
      kind: "appointment",
      title: "Exame agendado",
      subtitle: examLabel,
      badgeStatus: a.status,
      badgeType: "appointment",
      createdAt: a.scheduledAt,
    });
  }
  for (const d of collaborator.documents) {
    events.push({
      id: `d-${d.id}`,
      kind: "document",
      title: d.title,
      subtitle: timelineDocumentTypeLabel(d.type),
      createdAt: d.createdAt,
    });
  }

  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
}

export function canManageCollaborators(role: string): boolean {
  return ["ADMIN", "CLINIC_ADMIN", "RECEPCAO", "RECEPTION", "EMPRESA", "COMPANY_HR"].includes(role);
}

export function canClinicalCollaboratorAccess(role: string): boolean {
  return ["ADMIN", "CLINIC_ADMIN", "RECEPCAO", "RECEPTION", "MEDICO", "HEALTH_PROFESSIONAL", "TECNICO", "SST_TECHNICIAN"].includes(role);
}

export { maskCpf };
