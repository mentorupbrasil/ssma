import type { MonthlyClosingStatus } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Status de exibição do fechamento (mapeados a partir do enum Prisma). */
export const CLOSING_STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Em conferência",
  EM_REVISAO: "Em conferência",
  EM_CONFERENCIA: "Em conferência",
  COM_DIVERGENCIA: "Com pendências",
  AGUARDANDO_APROVACAO: "Pronto para fechar",
  FECHADO: "Fechado",
  FATURADO: "Enviado ao financeiro",
  PAGO: "Enviado ao financeiro",
  EM_ATRASO: "Com pendências",
  CANCELADO: "Cancelado",
};

export const CLOSING_SITUATION_LABELS: Record<string, string> = {
  OK: "Ok",
  SEM_PRECO: "Sem preço",
  FORA_PACOTE: "Fora do pacote",
  DUPLICADO: "Duplicidade",
  DIVERGENCIA: "Valor divergente",
  SEM_EMPRESA: "Sem empresa",
};

export const CRITICAL_CLOSING_SITUATIONS = new Set([
  "SEM_PRECO",
  "DUPLICADO",
  "DIVERGENCIA",
  "SEM_EMPRESA",
]);

export function closingStatusLabel(status: string) {
  return CLOSING_STATUS_LABELS[status] ?? status;
}

export function closingSituationLabel(situation: string | null | undefined) {
  if (!situation) return "Ok";
  return CLOSING_SITUATION_LABELS[situation] ?? situation;
}

export function isCriticalSituation(situation: string | null | undefined) {
  return !!situation && CRITICAL_CLOSING_SITUATIONS.has(situation);
}

/** Competência no formato Maio/2026 (evita bug de timezone que gera anos inválidos). */
export function formatCompetence(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const parts = parseCompetenceParts(value);
  if (!parts) return "—";
  const anchor = new Date(parts.year, parts.monthIndex, 1);
  const monthName = format(anchor, "MMMM", { locale: ptBR });
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized}/${parts.year}`;
}

export function parseCompetenceParts(value: Date | string): { year: number; monthIndex: number } | null {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})/);
    if (match) {
      const year = Number(match[1]);
      const monthIndex = Number(match[2]) - 1;
      if (year >= 2000 && year <= 2100 && monthIndex >= 0 && monthIndex <= 11) {
        return { year, monthIndex };
      }
    }
  }

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  // Datas só-dia vindas do banco costumam ser UTC midnight → usar UTC
  const year = d.getUTCFullYear();
  const monthIndex = d.getUTCMonth();
  if (year >= 2000 && year <= 2100) {
    return { year, monthIndex };
  }

  const localYear = d.getFullYear();
  const localMonth = d.getMonth();
  if (localYear >= 2000 && localYear <= 2100) {
    return { year: localYear, monthIndex: localMonth };
  }
  return null;
}

/** Converte "YYYY-MM" ou "YYYY-MM-DD" em Date local no dia 1. */
export function competenceToDate(input: string): Date {
  const match = input.match(/^(\d{4})-(\d{2})/);
  if (!match) {
    const fallback = new Date();
    return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  return new Date(year, monthIndex, 1);
}

export function resolveClosingWorkflowStatus(input: {
  withoutPriceCount: number;
  divergenceCount: number;
  duplicateCount?: number;
}): MonthlyClosingStatus {
  if (
    input.withoutPriceCount > 0 ||
    input.divergenceCount > 0 ||
    (input.duplicateCount ?? 0) > 0
  ) {
    return "COM_DIVERGENCIA";
  }
  return "AGUARDANDO_APROVACAO";
}

export function canCloseClosing(status: string, criticalCount: number) {
  if (criticalCount > 0) return false;
  return ["EM_CONFERENCIA", "AGUARDANDO_APROVACAO", "COM_DIVERGENCIA", "RASCUNHO", "EM_REVISAO"].includes(
    status
  );
}

export function canSendToFinance(status: string) {
  return status === "FECHADO";
}

export function canReopenClosing(status: string) {
  return status === "FECHADO" || status === "AGUARDANDO_APROVACAO" || status === "COM_DIVERGENCIA";
}
