import { ReferralStatus, LeadStatus, AppointmentStatus, DocumentStatus } from "@prisma/client";

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  NOVO: "Novo",
  EM_ANALISE: "Em análise",
  AGUARDANDO_AGENDAMENTO: "Aguardando agendamento",
  AGENDADO: "Agendado",
  EM_ATENDIMENTO: "Em atendimento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const REFERRAL_STATUS_COLORS: Record<ReferralStatus, string> = {
  NOVO: "bg-blue-100 text-blue-800",
  EM_ANALISE: "bg-amber-100 text-amber-800",
  AGUARDANDO_AGENDAMENTO: "bg-orange-100 text-orange-800",
  AGENDADO: "bg-purple-100 text-purple-800",
  EM_ATENDIMENTO: "bg-cyan-100 text-cyan-800",
  CONCLUIDO: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-slate-100 text-slate-600",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NOVO: "Novo",
  EM_CONTATO: "Em contato",
  PROPOSTA_ENVIADA: "Proposta enviada",
  FECHADO: "Fechado",
  PERDIDO: "Perdido",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  REALIZADO: "Realizado",
  FALTOU: "Faltou",
  CANCELADO: "Cancelado",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDENTE: "Pendente",
  EM_ELABORACAO: "Em elaboração",
  CONCLUIDO: "Concluído",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const CLINICAL_EXAM_LABELS: Record<string, string> = {
  ADMISSIONAL: "Admissional",
  DEMISSIONAL: "Demissional",
  PERIODICO: "Periódico",
  MUDANCA_FUNCAO: "Mudança de função",
  RETORNO_TRABALHO: "Retorno ao trabalho",
};

export const EXAM_CATEGORY_LABELS: Record<string, string> = {
  CLINICO: "Clínico",
  COMPLEMENTAR: "Complementar",
  LABORATORIAL: "Laboratorial",
  OUTRO: "Outro",
};
