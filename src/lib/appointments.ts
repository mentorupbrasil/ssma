import type {
  AppointmentStatus,
  ClinicalExamType,
  ReferralExamStatus,
  AppointmentHistoryAction,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isValid,
} from "date-fns";
import { CLINICAL_EXAM_LABELS, APPOINTMENT_STATUS_LABELS } from "@/types";
import { maskCpf, REFERRAL_EXAM_STATUS_LABELS } from "@/lib/referrals";

export type AppointmentViewMode = "day" | "week" | "month" | "list";

/** Indicadores compactos da listagem clínica (sem cancelados) */
export const APPOINTMENT_KPI_CARDS: {
  key: string;
  status: AppointmentStatus | "TODAY_AGENDADO";
  label: string;
  hint: string;
}[] = [
  { key: "today", status: "TODAY_AGENDADO", label: "Agendados hoje", hint: "Com horário hoje" },
  { key: "confirmado", status: "CONFIRMADO", label: "Confirmados", hint: "Presença confirmada" },
  { key: "em_atendimento", status: "EM_ATENDIMENTO", label: "Em atendimento", hint: "Em execução" },
  { key: "concluido", status: "CONCLUIDO", label: "Concluídos", hint: "Finalizados hoje" },
  { key: "faltou", status: "FALTOU", label: "Faltas", hint: "Não compareceu" },
];

export const APPOINTMENT_STAT_CARDS: {
  key: string;
  status: AppointmentStatus | "TODAY_AGENDADO";
  label: string;
}[] = [
  ...APPOINTMENT_KPI_CARDS.map(({ key, status, label }) => ({ key, status, label })),
  { key: "cancelado", status: "CANCELADO", label: "Cancelados" },
];

export const APPOINTMENT_HISTORY_ACTION_LABELS: Record<AppointmentHistoryAction, string> = {
  CREATED: "Agendamento criado",
  CONFIRMED: "Confirmado",
  RESCHEDULED: "Reagendado",
  CANCELLED: "Cancelado",
  NO_SHOW: "Comparecimento — falta registrada",
  ATTENDANCE_STARTED: "Atendimento iniciado",
  COMPLETED: "Atendimento concluído",
  NOTE_ADDED: "Observação adicionada",
  STATUS_CHANGED: "Status alterado",
};

export const APPOINTMENT_EXAM_STATUS_LABELS = REFERRAL_EXAM_STATUS_LABELS;

export type AppointmentListFilters = {
  q?: string;
  status?: string;
  companyId?: string;
  patientId?: string;
  clinicalExamType?: string;
  professionalId?: string;
  roomName?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  view?: AppointmentViewMode;
  page?: number;
  pageSize?: number;
};

export function parseFilterDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function getDateRangeForView(
  view: AppointmentViewMode,
  anchor: Date
): { from: Date; to: Date } {
  switch (view) {
    case "week":
      return { from: startOfWeek(anchor, { weekStartsOn: 1 }), to: endOfWeek(anchor, { weekStartsOn: 1 }) };
    case "month":
      return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
    case "list":
    case "day":
    default:
      return { from: startOfDay(anchor), to: endOfDay(anchor) };
  }
}

export function buildAppointmentWhere(
  filters: AppointmentListFilters,
  companyId?: string,
  professionalScopeId?: string
): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = {};

  if (companyId) {
    where.companyId = companyId;
  }

  if (professionalScopeId) {
    where.professionalId = professionalScopeId;
  }

  if (filters.status && filters.status !== "ALL") {
    if (filters.status === "TODAY_AGENDADO") {
      const today = new Date();
      where.scheduledAt = { gte: startOfDay(today), lte: endOfDay(today) };
      where.status = "AGENDADO";
    } else {
      where.status = filters.status as AppointmentStatus;
    }
  }

  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  if (filters.patientId) {
    where.patientId = filters.patientId;
  }

  if (filters.clinicalExamType) {
    where.clinicalExamType = filters.clinicalExamType as ClinicalExamType;
  }

  if (filters.professionalId) {
    where.professionalId = filters.professionalId;
  }

  if (filters.roomName) {
    where.roomName = { contains: filters.roomName, mode: "insensitive" };
  }

  const anchor = parseFilterDate(filters.date) ?? new Date();
  const view = filters.view ?? "day";

  if (filters.dateFrom || filters.dateTo) {
    where.scheduledAt = {};
    if (filters.dateFrom) {
      where.scheduledAt.gte = startOfDay(parseISO(filters.dateFrom));
    }
    if (filters.dateTo) {
      where.scheduledAt.lte = endOfDay(parseISO(filters.dateTo));
    }
  } else if (!filters.status || filters.status !== "TODAY_AGENDADO") {
    const range = getDateRangeForView(view, anchor);
    where.scheduledAt = { gte: range.from, lte: range.to };
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const qLower = q.toLowerCase();
    const digits = q.replace(/\D/g, "");
    const matchingExamTypes = (
      Object.entries(CLINICAL_EXAM_LABELS) as [ClinicalExamType, string][]
    )
      .filter(
        ([value, label]) =>
          label.toLowerCase().includes(qLower) || value.toLowerCase().includes(qLower)
      )
      .map(([value]) => value);

    where.OR = [
      { protocol: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { referral: { protocol: { contains: q, mode: "insensitive" } } },
      { company: { legalName: { contains: q, mode: "insensitive" } } },
      { company: { tradeName: { contains: q, mode: "insensitive" } } },
      { patient: { fullName: { contains: q, mode: "insensitive" } } },
      { exams: { some: { exam: { name: { contains: q, mode: "insensitive" } } } } },
      ...(digits.length >= 3 ? [{ patient: { cpf: { contains: digits } } }] : []),
      ...(matchingExamTypes.length
        ? [{ clinicalExamType: { in: matchingExamTypes } }]
        : []),
    ];
  }

  return where;
}

export type AppointmentListItem = {
  id: string;
  title: string;
  protocol: string | null;
  scheduledAt: string;
  status: AppointmentStatus;
  clinicalExamType: ClinicalExamType | null;
  type: string | null;
  notes: string | null;
  roomName: string | null;
  professionalName: string | null;
  employeeName: string | null;
  companyName: string | null;
  referralId: string | null;
  examSummary: string | null;
};

export type AppointmentDetailSerialized = {
  id: string;
  title: string;
  protocol: string | null;
  status: AppointmentStatus;
  clinicalExamType: ClinicalExamType | null;
  type: string | null;
  scheduledAt: string;
  endAt: string | null;
  notes: string | null;
  internalNotes: string | null;
  attendanceNotes: string | null;
  roomName: string | null;
  referralId: string | null;
  createdAt: string;
  updatedAt: string;
  professional: { id: string; name: string } | null;
  company: {
    id: string;
    legalName: string;
    tradeName: string | null;
    responsibleName: string | null;
    whatsapp: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  employee: {
    id: string;
    fullName: string;
    cpf: string;
    jobTitle: string | null;
    department: string | null;
    phone: string | null;
  } | null;
  exams: {
    id: string;
    examName: string;
    category: string;
    status: ReferralExamStatus;
    notes: string | null;
  }[];
  history: {
    id: string;
    action: AppointmentHistoryAction;
    fromStatus: AppointmentStatus | null;
    toStatus: AppointmentStatus | null;
    notes: string | null;
    performedByName: string | null;
    createdAt: string;
  }[];
};

const appointmentIncludeList = {
  patient: true,
  company: true,
  referral: true,
  professional: { select: { id: true, name: true } },
  exams: { include: { exam: true } },
} as const;

export function serializeAppointmentListItem(
  a: Prisma.AppointmentGetPayload<{ include: typeof appointmentIncludeList }>
): AppointmentListItem {
  const protocol = a.protocol ?? a.referral?.protocol ?? null;
  const examNames = a.exams.map((e) => e.exam.name);
  const clinicalLabel = a.clinicalExamType
    ? CLINICAL_EXAM_LABELS[a.clinicalExamType]
    : a.type;

  let examSummary: string | null = null;
  if (examNames.length > 0) {
    const prefix = clinicalLabel ? `${clinicalLabel === "ASO" ? "ASO" : clinicalLabel}` : "";
    examSummary = prefix && !examNames.some((n) => n.toLowerCase().includes("aso"))
      ? `ASO + ${examNames.join(" + ")}`
      : examNames.join(" + ");
    if (clinicalLabel && !examSummary.includes(clinicalLabel)) {
      examSummary = clinicalLabel + (examNames.length ? ` + ${examNames.join(" + ")}` : "");
    }
  } else if (clinicalLabel) {
    examSummary = clinicalLabel;
  }

  return {
    id: a.id,
    title: a.title,
    protocol,
    scheduledAt: a.scheduledAt.toISOString(),
    status: a.status,
    clinicalExamType: a.clinicalExamType,
    type: a.type,
    notes: a.notes,
    roomName: a.roomName,
    professionalName: a.professional?.name ?? null,
    employeeName: a.patient?.fullName ?? null,
    companyName: a.company ? (a.company.tradeName ?? a.company.legalName) : null,
    referralId: a.referralId,
    examSummary,
  };
}

const appointmentIncludeDetail = {
  patient: true,
  company: true,
  referral: true,
  professional: { select: { id: true, name: true } },
  exams: { include: { exam: true }, orderBy: { createdAt: "asc" as const } },
  history: {
    include: { performedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

export function serializeAppointmentDetail(
  a: Prisma.AppointmentGetPayload<{ include: typeof appointmentIncludeDetail }>
): AppointmentDetailSerialized {
  return {
    id: a.id,
    title: a.title,
    protocol: a.protocol ?? a.referral?.protocol ?? null,
    status: a.status,
    clinicalExamType: a.clinicalExamType,
    type: a.type,
    scheduledAt: a.scheduledAt.toISOString(),
    endAt: a.endAt?.toISOString() ?? null,
    notes: a.notes,
    internalNotes: a.internalNotes,
    attendanceNotes: a.attendanceNotes,
    roomName: a.roomName,
    referralId: a.referralId,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    professional: a.professional,
    company: a.company
      ? {
          id: a.company.id,
          legalName: a.company.legalName,
          tradeName: a.company.tradeName,
          responsibleName: a.company.responsibleName,
          whatsapp: a.company.whatsapp,
          phone: a.company.phone,
          email: a.company.email,
        }
      : null,
    employee: a.patient
      ? {
          id: a.patient.id,
          fullName: a.patient.fullName,
          cpf: maskCpf(a.patient.cpf),
          jobTitle: a.patient.jobTitle,
          department: a.patient.department,
          phone: a.patient.phone,
        }
      : null,
    exams: a.exams.map((e) => ({
      id: e.id,
      examName: e.exam.name,
      category: e.exam.category,
      status: e.status,
      notes: e.notes,
    })),
    history: a.history.map((h) => ({
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

export function getClinicalExamLabel(type: ClinicalExamType | null, fallback?: string | null): string {
  if (type) return CLINICAL_EXAM_LABELS[type] ?? type;
  return fallback ?? "—";
}

export function buildAppointmentConfirmationWhatsApp(params: {
  employeeName: string;
  companyName: string;
  examType: string;
  date: string;
  time: string;
}): string {
  return [
    "Olá! Confirmando seu atendimento na Unimetra:",
    "",
    `Colaborador: ${params.employeeName}`,
    `Empresa: ${params.companyName}`,
    `Tipo de exame: ${params.examType}`,
    `Data: ${params.date}`,
    `Horário: ${params.time}`,
    "",
    "Em caso de dúvidas ou necessidade de reagendamento, fale conosco por aqui.",
  ].join("\n");
}

export function buildAppointmentRescheduleWhatsApp(params: {
  employeeName: string;
  companyName: string;
  protocol: string;
}): string {
  return [
    "Olá! Precisamos ajustar o agendamento do atendimento:",
    "",
    `Colaborador: ${params.employeeName}`,
    `Empresa: ${params.companyName}`,
    `Protocolo: ${params.protocol}`,
    "",
    "Podemos verificar um novo horário?",
  ].join("\n");
}

export function formatAppointmentDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("pt-BR"),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function canManageAppointments(role: string): boolean {
  return ["ADMIN", "CLINIC_ADMIN", "RECEPCAO", "RECEPTION", "MEDICO", "HEALTH_PROFESSIONAL", "TECNICO", "SST_TECHNICIAN", "EMPRESA", "COMPANY_HR"].includes(role);
}

export function canClinicalAppointmentActions(role: string): boolean {
  return ["ADMIN", "RECEPCAO", "MEDICO", "TECNICO"].includes(role);
}

export function canReceptionAppointmentActions(role: string): boolean {
  return ["ADMIN", "RECEPCAO"].includes(role);
}

export function isAppointmentViewOnly(role: string): boolean {
  return role === "VISUALIZADOR";
}

export { appointmentIncludeList, appointmentIncludeDetail };
