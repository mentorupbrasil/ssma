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

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
  NOVO: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500", ring: "ring-blue-200" },
  EM_ANALISE: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", ring: "ring-amber-200" },
  AGUARDANDO_AGENDAMENTO: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500", ring: "ring-orange-200" },
  AGENDADO: { bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-500", ring: "ring-violet-200" },
  EM_ATENDIMENTO: { bg: "bg-cyan-50", text: "text-cyan-800", dot: "bg-cyan-500", ring: "ring-cyan-200" },
  AGUARDANDO_RESULTADO: { bg: "bg-sky-50", text: "text-sky-800", dot: "bg-sky-500", ring: "ring-sky-200" },
  AGUARDANDO_DOCUMENTO: { bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-500", ring: "ring-violet-200" },
  ASO_DISPONIVEL: { bg: "bg-teal-50", text: "text-teal-800", dot: "bg-teal-500", ring: "ring-teal-200" },
  CONCLUIDO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  CONVERTIDO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  AGUARDANDO_RETORNO: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500", ring: "ring-orange-200" },
  DUPLICADO: { bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-500", ring: "ring-violet-200" },
  CANCELADO: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", ring: "ring-slate-200" },
  EM_CONTATO: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", ring: "ring-amber-200" },
  PROPOSTA_ENVIADA: { bg: "bg-purple-50", text: "text-purple-800", dot: "bg-purple-500", ring: "ring-purple-200" },
  FECHADO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  PERDIDO: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", ring: "ring-slate-200" },
  CONFIRMADO: { bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-500", ring: "ring-violet-200" },
  REAGENDADO: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", ring: "ring-amber-200" },
  REALIZADO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  FALTOU: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", ring: "ring-red-200" },
  PENDENTE: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", ring: "ring-amber-200" },
  EM_EMISSAO: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500", ring: "ring-blue-200" },
  DISPONIVEL: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  EM_ELABORACAO: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500", ring: "ring-blue-200" },
  EM_DIA: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  ENTREGUE: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  RESPONDIDO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  ARQUIVADO: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", ring: "ring-slate-200" },
  EM_CONFERENCIA: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500", ring: "ring-blue-200" },
  COM_DIVERGENCIA: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", ring: "ring-red-200" },
  AGUARDANDO_APROVACAO: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500", ring: "ring-orange-200" },
  AGUARDANDO_FATURAMENTO: { bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-500", ring: "ring-violet-200" },
  CONFERIDO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  FATURADO: { bg: "bg-teal-50", text: "text-teal-800", dot: "bg-teal-500", ring: "ring-teal-200" },
  EM_ATRASO: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", ring: "ring-red-200" },
  ATIVA: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  INATIVA: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", ring: "ring-slate-200" },
  VENCIDA: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500", ring: "ring-orange-200" },
  BLOQUEADA: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", ring: "ring-red-200" },
  VENCIDO: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", ring: "ring-red-200" },
  EXPIRADO: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500", ring: "ring-orange-200" },
  ATIVO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  INATIVO: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", ring: "ring-slate-200" },
  AFASTADO: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", ring: "ring-amber-200" },
  DESLIGADO: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", ring: "ring-red-200" },
  EM_REVISAO: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", ring: "ring-amber-200" },
  RASCUNHO: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", ring: "ring-slate-200" },
  ENVIADO: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500", ring: "ring-blue-200" },
  AGUARDANDO_RESPOSTA: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500", ring: "ring-orange-200" },
  APROVADO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  RECUSADO: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", ring: "ring-red-200" },
  CONVERTIDO_ORCAMENTO: { bg: "bg-teal-50", text: "text-teal-800", dot: "bg-teal-500", ring: "ring-teal-200" },
  PAGO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  ATRASADO: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", ring: "ring-red-200" },
  ABERTO: { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500", ring: "ring-blue-200" },
  RESOLVIDO: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
};

export function StatusBadge({ status, type = "referral" }: StatusBadgeProps) {
  const labels = LABEL_MAPS[type];
  const label = labels[status as keyof typeof labels] ?? status;
  const colors = COLOR_MAP[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    ring: "ring-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        colors.bg,
        colors.text,
        colors.ring
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {label}
    </span>
  );
}
