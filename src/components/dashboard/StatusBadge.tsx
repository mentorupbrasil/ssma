import { REFERRAL_STATUS_LABELS, REFERRAL_STATUS_COLORS, LEAD_STATUS_LABELS, QUOTE_STATUS_LABELS, APPOINTMENT_STATUS_LABELS, DOCUMENT_STATUS_LABELS, PRE_REFERRAL_STATUS_LABELS, CONTACT_MESSAGE_STATUS_LABELS, COMPANY_STATUS_LABELS, PATIENT_STATUS_LABELS, EXAM_STATUS_LABELS } from "@/types";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  type?: "referral" | "lead" | "quote" | "appointment" | "document" | "preReferral" | "contact" | "company" | "collaborator" | "exam";
};

const LABEL_MAPS = {
  referral: REFERRAL_STATUS_LABELS,
  lead: LEAD_STATUS_LABELS,
  quote: QUOTE_STATUS_LABELS,
  appointment: APPOINTMENT_STATUS_LABELS,
  document: DOCUMENT_STATUS_LABELS,
  preReferral: PRE_REFERRAL_STATUS_LABELS,
  contact: CONTACT_MESSAGE_STATUS_LABELS,
  company: COMPANY_STATUS_LABELS,
  collaborator: PATIENT_STATUS_LABELS,
  exam: EXAM_STATUS_LABELS,
};

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  NOVO: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500" },
  EM_ANALISE: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  AGUARDANDO_AGENDAMENTO: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500" },
  AGENDADO: { bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-500" },
  EM_ATENDIMENTO: { bg: "bg-cyan-50", text: "text-cyan-800", dot: "bg-cyan-500" },
  AGUARDANDO_RESULTADO: { bg: "bg-sky-50", text: "text-sky-800", dot: "bg-sky-500" },
  AGUARDANDO_DOCUMENTO: { bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-500" },
  ASO_DISPONIVEL: { bg: "bg-teal-50", text: "text-teal-800", dot: "bg-teal-500" },
  CONCLUIDO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  CONVERTIDO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  AGUARDANDO_RETORNO: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500" },
  DUPLICADO: { bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-500" },
  CANCELADO: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  EM_CONTATO: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  PROPOSTA_ENVIADA: { bg: "bg-purple-50", text: "text-purple-800", dot: "bg-purple-500" },
  FECHADO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  PERDIDO: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  CONFIRMADO: { bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-500" },
  REAGENDADO: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  REALIZADO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  FALTOU: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500" },
  PENDENTE: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  EM_EMISSAO: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500" },
  DISPONIVEL: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  EM_ELABORACAO: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500" },
  EM_DIA: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  ENTREGUE: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  RESPONDIDO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  ARQUIVADO: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  ATIVA: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  INATIVA: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  BLOQUEADA: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500" },
  VENCIDO: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500" },
  EXPIRADO: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500" },
  ATIVO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  INATIVO: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  AFASTADO: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  DESLIGADO: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500" },
  EM_REVISAO: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  RASCUNHO: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  ENVIADO: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500" },
  AGUARDANDO_RESPOSTA: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500" },
  APROVADO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  RECUSADO: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500" },
  CONVERTIDO_ORCAMENTO: { bg: "bg-teal-50", text: "text-teal-800", dot: "bg-teal-500" },
};

export function StatusBadge({ status, type = "referral" }: StatusBadgeProps) {
  const labels = LABEL_MAPS[type];
  const label = labels[status as keyof typeof labels] ?? status;
  const colors = COLOR_MAP[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        colors.bg,
        colors.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {label}
    </span>
  );
}
