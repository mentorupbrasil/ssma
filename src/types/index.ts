import {
  ReferralStatus,
  LeadStatus,
  AppointmentStatus,
  DocumentStatus,
  PreReferralStatus,
  PreReferralClinicalExamType,
  ExamSelectionMode,
  ContactMessageStatus,
} from "@prisma/client";

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  NOVO: "Novo",
  EM_ANALISE: "Em análise",
  AGUARDANDO_AGENDAMENTO: "Aguardando agendamento",
  AGENDADO: "Agendado",
  EM_ATENDIMENTO: "Em atendimento",
  AGUARDANDO_RESULTADO: "Aguardando resultado",
  AGUARDANDO_DOCUMENTO: "Aguardando documento",
  ASO_DISPONIVEL: "ASO disponível",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const REFERRAL_STATUS_COLORS: Record<ReferralStatus, string> = {
  NOVO: "bg-blue-100 text-blue-800",
  EM_ANALISE: "bg-amber-100 text-amber-800",
  AGUARDANDO_AGENDAMENTO: "bg-orange-100 text-orange-800",
  AGENDADO: "bg-purple-100 text-purple-800",
  EM_ATENDIMENTO: "bg-cyan-100 text-cyan-800",
  AGUARDANDO_RESULTADO: "bg-sky-100 text-sky-800",
  AGUARDANDO_DOCUMENTO: "bg-violet-100 text-violet-800",
  ASO_DISPONIVEL: "bg-emerald-100 text-emerald-800",
  CONCLUIDO: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-slate-100 text-slate-600",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NOVO: "Novo",
  EM_CONTATO: "Em contato",
  PROPOSTA_ENVIADA: "Proposta enviada",
  FECHADO: "Fechado",
  PERDIDO: "Perdido",
  EXPIRADO: "Expirado",
};

export const COMPANY_STATUS_LABELS: Record<string, string> = {
  ATIVA: "Ativa",
  INATIVA: "Inativa",
  PENDENTE: "Pendente",
  BLOQUEADA: "Bloqueada",
};

export const PATIENT_STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  AFASTADO: "Afastado",
  DESLIGADO: "Desligado",
  PENDENTE: "Pendente",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  EM_ATENDIMENTO: "Em atendimento",
  CONCLUIDO: "Concluído",
  FALTOU: "Faltou",
  REAGENDADO: "Reagendado",
  CANCELADO: "Cancelado",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  AGENDADO: "bg-violet-100 text-violet-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  EM_ATENDIMENTO: "bg-cyan-100 text-cyan-800",
  CONCLUIDO: "bg-emerald-100 text-emerald-800",
  FALTOU: "bg-red-100 text-red-800",
  REAGENDADO: "bg-amber-100 text-amber-800",
  CANCELADO: "bg-slate-100 text-slate-600",
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

export const PRE_REFERRAL_CLINICAL_EXAM_LABELS: Record<PreReferralClinicalExamType, string> = {
  ADMISSIONAL: "Admissional",
  DEMISSIONAL: "Demissional",
  PERIODICO: "Periódico",
  MUDANCA_FUNCAO: "Mudança de função",
  RETORNO_TRABALHO: "Retorno ao trabalho",
  NAO_SEI_INFORMAR: "Não sei informar",
};

export const EXAM_SELECTION_MODE_LABELS: Record<ExamSelectionMode, string> = {
  NAO_SEI: "Não sei quais exames precisa",
  SELECIONAR: "Quero selecionar exames",
  ANEXAR_FUTURO: "Tenho pedido/guia e quero anexar futuramente",
};

export const PRE_REFERRAL_STATUS_LABELS: Record<PreReferralStatus, string> = {
  NOVO: "Novo",
  EM_ANALISE: "Em análise",
  AGUARDANDO_RETORNO: "Aguardando retorno",
  CONVERTIDO: "Convertido",
  CANCELADO: "Cancelado",
  DUPLICADO: "Duplicado",
};

export const PRE_REFERRAL_STATUS_COLORS: Record<PreReferralStatus, string> = {
  NOVO: "bg-blue-100 text-blue-800",
  EM_ANALISE: "bg-amber-100 text-amber-800",
  AGUARDANDO_RETORNO: "bg-orange-100 text-orange-800",
  CONVERTIDO: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-slate-100 text-slate-600",
  DUPLICADO: "bg-violet-100 text-violet-800",
};

export const CONTACT_MESSAGE_STATUS_LABELS: Record<ContactMessageStatus, string> = {
  NOVO: "Novo",
  EM_ANALISE: "Em análise",
  RESPONDIDO: "Respondido",
  ARQUIVADO: "Arquivado",
};

export const EXAM_CATEGORY_LABELS: Record<string, string> = {
  CLINICO: "Clínico",
  COMPLEMENTAR: "Complementar",
  LABORATORIAL: "Laboratorial",
  OUTRO: "Outro",
};
