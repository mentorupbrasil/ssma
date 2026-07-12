"use server";

import { normalizeRole } from "@/lib/tenant";
import { requireSession } from "@/lib/authz";
import { resolveClinicId } from "@/lib/scoped-db";
import {
  ensureClinicSubscription,
  getOrRefreshCurrentCharge,
  getSubscriptionPageData,
  syncSubscriptionFromProvider,
} from "@/lib/syncpay/subscription-service";
import { prisma } from "@/lib/prisma";
import {
  CHARGE_STATUS_LABELS,
  displaySubscriptionStatus,
  formatBrlFromReais,
  formatCompetenceLabel,
  isChargePayable,
} from "@/lib/syncpay/labels";

async function requireClinicAdmin() {
  const session = await requireSession();
  if (normalizeRole(session.user.role) !== "CLINIC_ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

function publicCharge(charge: {
  id: string;
  cycleNumber: number;
  competence: string;
  amount: number;
  status: string;
  dueDate: Date | null;
  expiresAt: Date | null;
  paidAt: Date | null;
  pixCode: string | null;
  qrCode: string | null;
}) {
  return {
    id: charge.id,
    cycleNumber: charge.cycleNumber,
    competence: charge.competence,
    competenceLabel: formatCompetenceLabel(charge.competence),
    amount: charge.amount,
    amountLabel: formatBrlFromReais(charge.amount),
    status: charge.status,
    statusLabel: CHARGE_STATUS_LABELS[charge.status] ?? charge.status,
    dueDate: charge.dueDate?.toISOString() ?? null,
    expiresAt: charge.expiresAt?.toISOString() ?? null,
    paidAt: charge.paidAt?.toISOString() ?? null,
    pixCode: charge.pixCode,
    qrCode: charge.qrCode,
    payable: isChargePayable(charge.status),
  };
}

export async function loadAssinaturaDataAction(page = 1) {
  try {
    const session = await requireClinicAdmin();
    const clinicId = await resolveClinicId(session);
    const data = await getSubscriptionPageData(clinicId, page, 12);
    const display = displaySubscriptionStatus(
      data.subscription?.status ?? "pending_first_payment",
      data.currentCharge?.status
    );
    const currentPaid = data.currentCharge?.status === "paid";

    return {
      ok: true as const,
      configured: data.configured,
      subscription: data.subscription
        ? {
            id: data.subscription.id,
            planName: "Assinatura Unimetra",
            amount: data.amount,
            amountLabel: formatBrlFromReais(data.amount ?? 0),
            status: data.subscription.status,
            statusKey: display.key,
            statusLabel: display.label,
            nextDueAt: data.subscription.nextDueAt?.toISOString() ?? null,
            lastPaidAt:
              data.lastPaidCharge?.paidAt?.toISOString() ??
              data.subscription.lastPaidAt?.toISOString() ??
              null,
            gracePeriodDays: data.gracePeriodDays,
            billingMethod: "Pix",
            checkoutUrl: data.checkoutUrl,
          }
        : null,
      currentCharge: data.currentCharge ? publicCharge(data.currentCharge) : null,
      currentPaid,
      charges: data.charges.map(publicCharge),
      totalCharges: data.totalCharges,
      page: data.page,
      pageSize: data.pageSize,
    };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false as const, error: "forbidden" };
    }
    console.error("[syncpay] loadAssinaturaDataAction failed");
    return { ok: false as const, error: "load_failed" };
  }
}

export async function ensureAssinaturaAction() {
  try {
    const session = await requireClinicAdmin();
    const clinicId = await resolveClinicId(session);
    await ensureClinicSubscription({ clinicId, userId: session.user.id });
    return loadAssinaturaDataAction(1);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "FORBIDDEN") return { ok: false as const, error: "forbidden" };
      if (err.message === "CLINIC_BILLING_IDENTITY_INCOMPLETE") {
        return { ok: false as const, error: "identity_incomplete" };
      }
      if (err.message === "SYNCPAY_PLAN_TOKEN_MISSING") {
        return { ok: false as const, error: "plan_missing" };
      }
      if (err.message.startsWith("SYNCPAY_") || err.message.includes("SYNCPAY")) {
        return { ok: false as const, error: "charge_failed" };
      }
    }
    console.error("[syncpay] ensureAssinaturaAction failed");
    return { ok: false as const, error: "charge_failed" };
  }
}

export async function openPaymentChargeAction() {
  try {
    const session = await requireClinicAdmin();
    const clinicId = await resolveClinicId(session);
    const result = await getOrRefreshCurrentCharge({
      clinicId,
      userId: session.user.id,
    });

    if (result.charge.status === "paid") {
      return {
        ok: true as const,
        alreadyPaid: true as const,
        charge: publicCharge(result.charge),
        subscriptionStatus: result.subscription.status,
      };
    }

    return {
      ok: true as const,
      alreadyPaid: false as const,
      charge: publicCharge(result.charge),
      subscriptionStatus: result.subscription.status,
      checkoutUrl: result.subscription.checkoutUrl,
    };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false as const, error: "forbidden" };
    }
    if (err instanceof Error && err.message === "CLINIC_BILLING_IDENTITY_INCOMPLETE") {
      return { ok: false as const, error: "identity_incomplete" };
    }
    if (err instanceof Error && err.message === "SYNCPAY_PLAN_TOKEN_MISSING") {
      return { ok: false as const, error: "plan_missing" };
    }
    console.error("[syncpay] openPaymentChargeAction failed");
    return { ok: false as const, error: "charge_failed" };
  }
}

/** Polling local — nunca consulta SyncPay no frontend. */
export async function pollChargeStatusAction(chargeId: string) {
  try {
    const session = await requireClinicAdmin();
    const clinicId = await resolveClinicId(session);
    const charge = await prisma.subscriptionCharge.findFirst({
      where: {
        id: chargeId,
        subscription: { clinicId, provider: "syncpay" },
      },
      include: { subscription: { select: { status: true, id: true } } },
    });
    if (!charge) return { ok: false as const, error: "not_found" };

    return {
      ok: true as const,
      charge: publicCharge(charge),
      subscriptionStatus: charge.subscription.status,
      paid: charge.status === "paid",
    };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false as const, error: "forbidden" };
    }
    console.error("[syncpay] pollChargeStatusAction failed");
    return { ok: false as const, error: "poll_failed" };
  }
}

/** Consulta server-side validada (opcional, sob demanda) — não usada no polling do modal. */
export async function refreshSubscriptionFromProviderAction() {
  try {
    const session = await requireClinicAdmin();
    const clinicId = await resolveClinicId(session);
    const sub = await prisma.clinicSubscription.findUnique({
      where: { clinicId_provider: { clinicId, provider: "syncpay" } },
    });
    if (!sub) return { ok: false as const, error: "not_found" };
    await syncSubscriptionFromProvider(sub.id);
    return loadAssinaturaDataAction(1);
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false as const, error: "forbidden" };
    }
    console.error("[syncpay] refreshSubscriptionFromProviderAction failed");
    return { ok: false as const, error: "poll_failed" };
  }
}

export async function getDashboardBillingNoticeAction() {
  try {
    const session = await requireClinicAdmin();
    const clinicId = await resolveClinicId(session);
    const sub = await prisma.clinicSubscription.findUnique({
      where: { clinicId_provider: { clinicId, provider: "syncpay" } },
    });
    if (!sub) return { ok: true as const, notice: null };

    const current = await prisma.subscriptionCharge.findFirst({
      where: { subscriptionId: sub.id },
      orderBy: { cycleNumber: "desc" },
    });

    const { getBillingNotice } = await import("@/lib/syncpay/labels");
    const notice = getBillingNotice({
      nextDueAt: current?.dueDate ?? sub.nextDueAt,
      currentChargePaid: current?.status === "paid",
      subscriptionStatus: sub.status,
    });

    return { ok: true as const, notice };
  } catch {
    return { ok: true as const, notice: null };
  }
}
