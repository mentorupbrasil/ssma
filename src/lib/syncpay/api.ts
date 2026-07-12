import "server-only";

import { syncPayRequest } from "@/lib/syncpay/client";
import type {
  SyncPayChargeResource,
  SyncPayEnrollResponse,
  SyncPayPaginationMeta,
  SyncPayPlanResource,
  SyncPaySubscriptionResource,
} from "@/lib/syncpay/types";

export async function listSubscriptionPlans(params?: {
  page?: number;
  per_page?: number;
  status?: string;
}) {
  return syncPayRequest<{ data: SyncPayPlanResource[]; meta: SyncPayPaginationMeta }>(
    "/api/partner/v1/subscription-plans",
    { searchParams: params }
  );
}

export async function createSubscriptionPlan(body: {
  name: string;
  description: string;
  amount: number;
  periodicity_days: number;
  billing_method: "qr_code";
  billing_advance_days?: number;
  grace_period_days?: number;
  max_retry_attempts?: number;
  status?: "active";
}) {
  return syncPayRequest<{ data: SyncPayPlanResource }>("/api/partner/v1/subscription-plans", {
    method: "POST",
    body,
  });
}

export async function getSubscriptionPlan(planToken: string) {
  return syncPayRequest<{ data: SyncPayPlanResource }>(
    `/api/partner/v1/subscription-plans/${planToken}`
  );
}

export async function enrollSubscriber(
  planToken: string,
  body: { name: string; email: string; document: string; phone?: string | null }
) {
  return syncPayRequest<SyncPayEnrollResponse>(
    `/api/partner/v1/subscription-plans/${planToken}/enroll`,
    { method: "POST", body }
  );
}

export async function getSubscription(subscriptionToken: string) {
  return syncPayRequest<{ data: SyncPaySubscriptionResource }>(
    `/api/partner/v1/subscriptions/${subscriptionToken}`
  );
}

export async function resendSubscriptionCharge(subscriptionToken: string) {
  return syncPayRequest<{ charge: SyncPayChargeResource }>(
    `/api/partner/v1/subscriptions/${subscriptionToken}/resend-charge`,
    { method: "PATCH" }
  );
}

export async function createPartnerWebhook(body: {
  title: string;
  url: string;
  event: string;
  trigger_all_products: boolean;
}) {
  return syncPayRequest<{
    id: number;
    title: string;
    url: string;
    event: string;
    trigger_all_products: boolean;
    token?: string;
    created_at?: string;
  }>("/api/partner/v1/webhooks", { method: "POST", body });
}

export async function listPartnerWebhooks() {
  return syncPayRequest<{
    data: Array<{
      id: number;
      title: string;
      url: string;
      event: string;
      token?: string;
    }>;
  }>("/api/partner/v1/webhooks");
}
