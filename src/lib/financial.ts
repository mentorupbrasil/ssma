import { formatCompetence } from "@/lib/closings";

/** Status de exibição da conta a receber. */
export type ReceivableDisplayStatus =
  | "AGUARDANDO_FATURAMENTO"
  | "FATURADA"
  | "A_VENCER"
  | "VENCIDA"
  | "RECEBIDA"
  | "CANCELADA";

export const RECEIVABLE_STATUS_LABELS: Record<ReceivableDisplayStatus, string> = {
  AGUARDANDO_FATURAMENTO: "Aguardando faturamento",
  FATURADA: "Faturada",
  A_VENCER: "A vencer",
  VENCIDA: "Vencida",
  RECEBIDA: "Recebida",
  CANCELADA: "Cancelada",
};

export const RECEIVABLE_STATUS_FILTER_OPTIONS: {
  value: ReceivableDisplayStatus;
  label: string;
}[] = [
  { value: "AGUARDANDO_FATURAMENTO", label: "Aguardando faturamento" },
  { value: "FATURADA", label: "Faturada" },
  { value: "A_VENCER", label: "A vencer" },
  { value: "VENCIDA", label: "Vencida" },
  { value: "RECEBIDA", label: "Recebida" },
  { value: "CANCELADA", label: "Cancelada" },
];

export function resolveReceivableDisplayStatus(input: {
  status: string;
  dueDate: Date | string;
  invoiceNumber?: string | null;
  now?: Date;
}): ReceivableDisplayStatus {
  if (input.status === "CANCELADO") return "CANCELADA";
  if (input.status === "PAGO") return "RECEBIDA";
  if (input.status === "AGUARDANDO_FATURAMENTO") return "AGUARDANDO_FATURAMENTO";

  const due = typeof input.dueDate === "string" ? new Date(input.dueDate) : input.dueDate;
  const now = input.now ?? new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (input.status === "ATRASADO" || due < startOfToday) return "VENCIDA";
  if (input.invoiceNumber?.trim()) return "FATURADA";
  return "A_VENCER";
}

export function receivableStatusLabel(status: ReceivableDisplayStatus | string) {
  return RECEIVABLE_STATUS_LABELS[status as ReceivableDisplayStatus] ?? status;
}

export function receivableStatusToneKey(display: ReceivableDisplayStatus): string {
  switch (display) {
    case "AGUARDANDO_FATURAMENTO":
      return "AGUARDANDO_FATURAMENTO";
    case "FATURADA":
      return "FATURADO";
    case "A_VENCER":
      return "PENDENTE";
    case "VENCIDA":
      return "ATRASADO";
    case "RECEBIDA":
      return "PAGO";
    case "CANCELADA":
      return "CANCELADO";
    default:
      return display;
  }
}

export function formatReceivableCompetenceDescription(input: {
  description: string;
  referenceMonth?: Date | string | null;
  closingReferenceMonth?: Date | string | null;
}): { competence: string | null; line: string } {
  const month = input.referenceMonth ?? input.closingReferenceMonth ?? null;
  const competence = month ? formatCompetence(month) : null;
  if (competence) {
    return { competence, line: `${competence} · ${input.description}` };
  }
  return { competence: null, line: input.description };
}

const RECEIPT_PREFIX = "comprovante:";

export function encodeReceiptRef(url: string) {
  return `${RECEIPT_PREFIX}${url.trim()}`;
}

export function decodeReceiptRef(category: string | null | undefined): string | null {
  if (!category?.startsWith(RECEIPT_PREFIX)) return null;
  return category.slice(RECEIPT_PREFIX.length) || null;
}
