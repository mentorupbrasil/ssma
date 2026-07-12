import "server-only";

import { assertSyncPayConfigured, getSyncPayConfig, PLAN_NAME } from "@/lib/syncpay/config";
import {
  createSubscriptionPlan,
  getSubscriptionPlan,
  listSubscriptionPlans,
} from "@/lib/syncpay/api";
import type { SyncPayPlanResource } from "@/lib/syncpay/types";

/**
 * Rotina única de configuração do plano: reutiliza se existir, cria só se necessário.
 * Não deve ser chamada em toda inicialização/deploy — usar script CLI.
 */
export async function ensureUnimetraPlan(): Promise<SyncPayPlanResource> {
  const cfg = assertSyncPayConfigured();

  if (cfg.planToken) {
    try {
      const existing = await getSubscriptionPlan(cfg.planToken);
      if (existing.data?.token) return existing.data;
    } catch {
      // Token inválido — tenta localizar por nome abaixo.
    }
  }

  let page = 1;
  let lastPage = 1;
  do {
    const listed = await listSubscriptionPlans({ page, per_page: 100, status: "active" });
    const match = listed.data.find(
      (p) =>
        p.name === PLAN_NAME &&
        p.billing_method === "qr_code" &&
        p.amount === cfg.monthlyAmount
    );
    if (match) return match;
    lastPage = listed.meta?.last_page ?? 1;
    page += 1;
  } while (page <= lastPage);

  const created = await createSubscriptionPlan({
    name: PLAN_NAME,
    description: cfg.planDescription,
    amount: cfg.monthlyAmount,
    periodicity_days: 30,
    billing_method: "qr_code",
    billing_advance_days: 3,
    grace_period_days: cfg.graceDays,
    max_retry_attempts: 3,
    status: "active",
  });

  return created.data;
}

export function getConfiguredPlanTokenOrNull() {
  return getSyncPayConfig().planToken || null;
}
