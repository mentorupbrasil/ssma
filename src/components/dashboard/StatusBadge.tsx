import { REFERRAL_STATUS_LABELS, REFERRAL_STATUS_COLORS, LEAD_STATUS_LABELS, APPOINTMENT_STATUS_LABELS, DOCUMENT_STATUS_LABELS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  type?: "referral" | "lead" | "appointment" | "document";
};

const LABEL_MAPS = {
  referral: REFERRAL_STATUS_LABELS,
  lead: LEAD_STATUS_LABELS,
  appointment: APPOINTMENT_STATUS_LABELS,
  document: DOCUMENT_STATUS_LABELS,
};

const COLOR_MAP = {
  ...REFERRAL_STATUS_COLORS,
  NOVO: "bg-blue-100 text-blue-800",
  EM_CONTATO: "bg-amber-100 text-amber-800",
  PROPOSTA_ENVIADA: "bg-purple-100 text-purple-800",
  FECHADO: "bg-emerald-100 text-emerald-800",
  PERDIDO: "bg-slate-100 text-slate-600",
  AGENDADO: "bg-blue-100 text-blue-800",
  CONFIRMADO: "bg-purple-100 text-purple-800",
  REALIZADO: "bg-emerald-100 text-emerald-800",
  FALTOU: "bg-red-100 text-red-800",
  PENDENTE: "bg-amber-100 text-amber-800",
  EM_ELABORACAO: "bg-blue-100 text-blue-800",
  CONCLUIDO: "bg-emerald-100 text-emerald-800",
  ENTREGUE: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status, type = "referral" }: StatusBadgeProps) {
  const labels = LABEL_MAPS[type];
  const label = labels[status as keyof typeof labels] ?? status;
  const color = COLOR_MAP[status as keyof typeof COLOR_MAP] ?? "bg-slate-100 text-slate-700";

  return (
    <Badge variant="secondary" className={cn("font-medium", color)}>
      {label}
    </Badge>
  );
}
