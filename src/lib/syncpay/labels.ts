import type { SyncPayChargeStatus, SyncPaySubscriptionStatus } from "@/lib/syncpay/types";

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  pending_first_payment: "Aguardando primeiro pagamento",
  active: "Ativa",
  awaiting_payment: "Aguardando pagamento",
  overdue: "Em atraso",
  suspended: "Suspensa",
  cancelled: "Cancelada",
};

export const CHARGE_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  expired: "Expirado",
  failed: "Falhou",
};

export function displaySubscriptionStatus(
  providerStatus: string,
  currentChargeStatus?: string | null
): { key: string; label: string } {
  if (providerStatus === "pending_first_payment") {
    return { key: "pending_first_payment", label: SUBSCRIPTION_STATUS_LABELS.pending_first_payment };
  }
  if (providerStatus === "overdue") {
    return { key: "overdue", label: SUBSCRIPTION_STATUS_LABELS.overdue };
  }
  if (providerStatus === "suspended") {
    return { key: "suspended", label: SUBSCRIPTION_STATUS_LABELS.suspended };
  }
  if (providerStatus === "cancelled") {
    return { key: "cancelled", label: SUBSCRIPTION_STATUS_LABELS.cancelled };
  }
  if (
    providerStatus === "active" &&
    (currentChargeStatus === "pending" || currentChargeStatus === "expired")
  ) {
    return { key: "awaiting_payment", label: SUBSCRIPTION_STATUS_LABELS.awaiting_payment };
  }
  return { key: "active", label: SUBSCRIPTION_STATUS_LABELS.active };
}

export function competenceFromDueDate(dueDate: Date | string | null | undefined): string {
  const d = dueDate ? new Date(dueDate) : new Date();
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatCompetenceLabel(competence: string): string {
  const [y, m] = competence.split("-");
  const month = Number.parseInt(m ?? "", 10);
  const year = Number.parseInt(y ?? "", 10);
  if (!month || !year) return competence;
  const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatBrlFromReais(amount: number): string {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function isChargePayable(status: string): boolean {
  return status === "pending" || status === "expired";
}

export function isPixStillValid(expiresAt: Date | null | undefined, pixCode?: string | null): boolean {
  if (!pixCode) return false;
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now() + 30_000;
}

export function mapProviderSubscriptionStatus(status: string): SyncPaySubscriptionStatus | string {
  return status;
}

export function mapProviderChargeStatus(status: string): SyncPayChargeStatus | string {
  return status;
}

/** Aviso discreto na visão geral (somente admin). */
export function getBillingNotice(params: {
  nextDueAt: Date | null;
  currentChargePaid: boolean;
  subscriptionStatus: string;
}): { message: string; tone: "info" | "warning" | "danger" } | null {
  if (params.currentChargePaid) return null;
  if (params.subscriptionStatus === "cancelled") return null;

  if (params.subscriptionStatus === "overdue" || params.subscriptionStatus === "suspended") {
    return {
      message: "Mensalidade em atraso. Realize o pagamento para regularizar sua assinatura.",
      tone: "danger",
    };
  }

  if (!params.nextDueAt) {
    if (params.subscriptionStatus === "pending_first_payment") {
      return {
        message: "Sua mensalidade aguarda o primeiro pagamento.",
        tone: "warning",
      };
    }
    return null;
  }

  const due = new Date(params.nextDueAt);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    return {
      message: "Mensalidade em atraso. Realize o pagamento para regularizar sua assinatura.",
      tone: "danger",
    };
  }
  if (diffDays === 0) {
    return { message: "Sua mensalidade vence hoje.", tone: "warning" };
  }
  if (diffDays <= 3) {
    return { message: "Sua mensalidade vence em 3 dias.", tone: "warning" };
  }
  if (diffDays <= 7) {
    return { message: "Sua mensalidade vence em 7 dias.", tone: "info" };
  }
  return null;
}
