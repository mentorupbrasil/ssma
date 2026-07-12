import "server-only";

/** Tipos alinhados à documentação SyncPay (partner v1 — Assinaturas). */

export type SyncPayBillingMethod = "qr_code" | "pix_automatico";
export type SyncPayPlanStatus = "active" | "inactive" | "archived";
export type SyncPaySubscriptionStatus =
  | "pending_first_payment"
  | "active"
  | "overdue"
  | "suspended"
  | "cancelled";
export type SyncPayChargeStatus = "pending" | "paid" | "expired" | "failed";

export type SyncPayPlanResource = {
  token: string;
  name: string;
  description: string | null;
  amount: number;
  periodicity_days: number;
  billing_advance_days: number;
  grace_period_days: number;
  max_retry_attempts: number;
  billing_method: SyncPayBillingMethod;
  status: SyncPayPlanStatus;
  checkout_url: string;
};

export type SyncPayChargePayment = {
  pix_code: string | null;
  qr_code: string | null;
};

export type SyncPayChargeResource = {
  cycle_number: number;
  amount: number;
  status: SyncPayChargeStatus;
  due_date: string;
  expires_at: string | null;
  paid_at: string | null;
  payment?: SyncPayChargePayment | null;
  /** Presente no enroll (QR Code). */
  identifier?: string;
};

export type SyncPaySubscriptionResource = {
  token: string;
  status: SyncPaySubscriptionStatus;
  subscriber_name: string;
  subscriber_email: string;
  subscriber_document: string;
  subscriber_phone: string | null;
  started_at: string | null;
  next_charge_at: string | null;
  overdue_since: string | null;
  suspended_at: string | null;
  cancelled_at: string | null;
  retry_count: number;
  plan: SyncPayPlanResource | null;
  charges?: SyncPayChargeResource[] | null;
};

export type SyncPayEnrollQrPayment = {
  pix_code: string;
  qr_code: string | null;
  identifier: string;
  expires_at: string | null;
};

export type SyncPayEnrollResponse = {
  subscription_token: string;
  status: SyncPaySubscriptionStatus;
  billing_method: SyncPayBillingMethod;
  payment: SyncPayEnrollQrPayment | Record<string, unknown>;
};

export type SyncPayPaginationMeta = {
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
};

export const SYNCPAY_SUBSCRIPTION_EVENTS = [
  "assinatura_ativada",
  "assinatura_em_atraso",
  "assinatura_suspensa",
  "assinatura_cancelada",
  "assinatura_reativada",
] as const;

export type SyncPaySubscriptionEvent = (typeof SYNCPAY_SUBSCRIPTION_EVENTS)[number];
