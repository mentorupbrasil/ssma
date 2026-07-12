import "server-only";

import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/server";
import { assertSyncPayConfigured, getSyncPayConfig } from "@/lib/syncpay/config";
import {
  enrollSubscriber,
  getSubscription,
  resendSubscriptionCharge,
} from "@/lib/syncpay/api";
import {
  competenceFromDueDate,
  digitsOnly,
  isPixStillValid,
} from "@/lib/syncpay/labels";
import type { SyncPayChargeResource, SyncPayEnrollQrPayment } from "@/lib/syncpay/types";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDueDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`);
  }
  return parseDate(value);
}

async function safeAudit(params: {
  action: string;
  entityId?: string;
  details: string;
  userId?: string;
  clinicId?: string;
}) {
  try {
    await createAuditLog({
      action: params.action,
      entity: "ClinicSubscription",
      entityId: params.entityId,
      details: params.details,
      userId: params.userId,
    });
  } catch {
    // Auditoria não deve quebrar o fluxo de cobrança.
  }
}

export async function loadClinicBillingIdentity(clinicId: string) {
  const keys = [
    "clinic.display_name",
    "clinic.legal_name",
    "clinic.cnpj",
    "clinic.email",
    "clinic.phone",
  ];
  const [settings, clinic] = await Promise.all([
    prisma.setting.findMany({
      where: { clinicId, key: { in: keys } },
      select: { key: true, value: true },
    }),
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, email: true, whatsapp: true },
    }),
  ]);
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const name =
    map["clinic.legal_name"]?.trim() ||
    map["clinic.display_name"]?.trim() ||
    clinic?.name ||
    "";
  const email = map["clinic.email"]?.trim() || clinic?.email || "";
  const document = digitsOnly(map["clinic.cnpj"]);
  const phone = digitsOnly(map["clinic.phone"] || clinic?.whatsapp);

  return { name, email, document, phone: phone || null };
}

async function upsertChargeSafe(
  subscriptionId: string,
  charge: SyncPayChargeResource,
  providerChargeId?: string | null
) {
  const existing = await prisma.subscriptionCharge.findUnique({
    where: {
      subscriptionId_cycleNumber: {
        subscriptionId,
        cycleNumber: charge.cycle_number,
      },
    },
  });

  if (existing?.status === "paid") {
    return prisma.subscriptionCharge.update({
      where: { id: existing.id },
      data: {
        paidAt: existing.paidAt ?? parseDate(charge.paid_at) ?? new Date(),
        ...(charge.payment?.pix_code ? {} : {}),
      },
    });
  }

  const dueDate = parseDueDate(charge.due_date);
  const competence = competenceFromDueDate(dueDate);
  const identifier = providerChargeId || charge.identifier || existing?.providerChargeId || null;

  return prisma.subscriptionCharge.upsert({
    where: {
      subscriptionId_cycleNumber: {
        subscriptionId,
        cycleNumber: charge.cycle_number,
      },
    },
    create: {
      subscriptionId,
      providerChargeId: identifier,
      cycleNumber: charge.cycle_number,
      competence,
      amount: charge.amount,
      status: charge.status,
      dueDate,
      expiresAt: parseDate(charge.expires_at),
      paidAt: parseDate(charge.paid_at),
      pixCode: charge.payment?.pix_code ?? null,
      qrCode: charge.payment?.qr_code ?? null,
    },
    update: {
      providerChargeId: identifier,
      competence,
      amount: charge.amount,
      status: charge.status,
      dueDate,
      expiresAt: parseDate(charge.expires_at),
      paidAt: parseDate(charge.paid_at),
      pixCode: charge.payment?.pix_code ?? existing?.pixCode ?? null,
      qrCode: charge.payment?.qr_code ?? existing?.qrCode ?? null,
    },
  });
}

export async function syncSubscriptionFromProvider(subscriptionId: string) {
  const sub = await prisma.clinicSubscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return null;

  const remote = await getSubscription(sub.providerSubscriptionToken);
  const data = remote.data;

  const updated = await prisma.clinicSubscription.update({
    where: { id: sub.id },
    data: {
      status: data.status,
      nextDueAt: parseDate(data.next_charge_at),
      amount: data.plan?.amount ?? sub.amount,
      gracePeriodDays: data.plan?.grace_period_days ?? sub.gracePeriodDays,
      checkoutUrl: data.plan?.checkout_url ?? sub.checkoutUrl,
      providerPlanToken: data.plan?.token ?? sub.providerPlanToken,
      ...(data.status === "active" && data.started_at
        ? { lastPaidAt: sub.lastPaidAt ?? parseDate(data.started_at) }
        : {}),
    },
  });

  if (data.charges?.length) {
    for (const charge of data.charges) {
      await upsertChargeSafe(sub.id, charge);
    }
  }

  return updated;
}

export async function ensureClinicSubscription(params: {
  clinicId: string;
  userId?: string;
}) {
  const existing = await prisma.clinicSubscription.findUnique({
    where: { clinicId_provider: { clinicId: params.clinicId, provider: "syncpay" } },
  });
  if (existing) {
    try {
      await syncSubscriptionFromProvider(existing.id);
    } catch {
      await safeAudit({
        action: "INTEGRATION_FAILURE",
        entityId: existing.id,
        details: "Falha ao sincronizar assinatura com o provedor.",
        userId: params.userId,
        clinicId: params.clinicId,
      });
    }
    return prisma.clinicSubscription.findUnique({ where: { id: existing.id } });
  }

  const cfg = assertSyncPayConfigured();
  if (!cfg.planToken) {
    throw new Error("SYNCPAY_PLAN_TOKEN_MISSING");
  }
  const planToken = cfg.planToken;
  const identity = await loadClinicBillingIdentity(params.clinicId);

  if (!identity.name || !identity.email || identity.document.length < 11) {
    throw new Error("CLINIC_BILLING_IDENTITY_INCOMPLETE");
  }

  const enrolled = await enrollSubscriber(planToken, {
    name: identity.name,
    email: identity.email,
    document: identity.document,
    phone: identity.phone,
  });

  if (enrolled.billing_method !== "qr_code") {
    throw new Error("SYNCPAY_UNEXPECTED_BILLING_METHOD");
  }

  const payment = enrolled.payment as SyncPayEnrollQrPayment;
  let checkoutUrl: string | null = null;
  try {
    const { getSubscriptionPlan } = await import("@/lib/syncpay/api");
    const plan = await getSubscriptionPlan(planToken);
    checkoutUrl = plan.data.checkout_url ?? null;
  } catch {
    checkoutUrl = null;
  }

  const created = await prisma.clinicSubscription.create({
    data: {
      clinicId: params.clinicId,
      provider: "syncpay",
      providerPlanToken: planToken,
      providerSubscriptionToken: enrolled.subscription_token,
      billingMethod: "qr_code",
      amount: cfg.monthlyAmount,
      status: enrolled.status,
      gracePeriodDays: cfg.graceDays,
      checkoutUrl,
    },
  });

  await upsertChargeSafe(created.id, {
    cycle_number: 1,
    amount: cfg.monthlyAmount,
    status: "pending",
    due_date: new Date().toISOString().slice(0, 10),
    expires_at: payment.expires_at,
    paid_at: null,
    payment: {
      pix_code: payment.pix_code,
      qr_code: payment.qr_code,
    },
    identifier: payment.identifier,
  });

  await safeAudit({
    action: "CREATE",
    entityId: created.id,
    details: "Assinatura criada (matrícula SyncPay).",
    userId: params.userId,
    clinicId: params.clinicId,
  });

  try {
    await syncSubscriptionFromProvider(created.id);
  } catch {
    // Cobrança inicial já salva.
  }

  return prisma.clinicSubscription.findUnique({ where: { id: created.id } });
}

export async function getOrRefreshCurrentCharge(params: {
  clinicId: string;
  userId?: string;
}) {
  const sub = await ensureClinicSubscription(params);
  if (!sub) throw new Error("SUBSCRIPTION_NOT_FOUND");

  const latest = await prisma.subscriptionCharge.findFirst({
    where: { subscriptionId: sub.id },
    orderBy: { cycleNumber: "desc" },
  });

  if (latest?.status === "paid") {
    return { subscription: sub, charge: latest, renewed: false };
  }

  const pending = await prisma.subscriptionCharge.findFirst({
    where: {
      subscriptionId: sub.id,
      status: { in: ["pending", "expired"] },
    },
    orderBy: { cycleNumber: "desc" },
  });

  if (
    pending &&
    pending.status === "pending" &&
    isPixStillValid(pending.expiresAt, pending.pixCode)
  ) {
    return { subscription: sub, charge: pending, renewed: false };
  }

  // Pix expirado ou ausente → reenviar cobrança oficial do ciclo atual (sem duplicar ciclo).
  try {
    const resent = await resendSubscriptionCharge(sub.providerSubscriptionToken);
    const charge = await upsertChargeSafe(sub.id, resent.charge);
    await safeAudit({
      action: "UPDATE",
      entityId: sub.id,
      details: `Pix renovado (ciclo ${resent.charge.cycle_number}).`,
      userId: params.userId,
      clinicId: params.clinicId,
    });
    await syncSubscriptionFromProvider(sub.id).catch(() => null);
    const refreshed = await prisma.subscriptionCharge.findUnique({ where: { id: charge.id } });
    const latestSub = await prisma.clinicSubscription.findUnique({ where: { id: sub.id } });
    return { subscription: latestSub!, charge: refreshed!, renewed: true };
  } catch (err) {
    await safeAudit({
      action: "INTEGRATION_FAILURE",
      entityId: sub.id,
      details: "Falha ao gerar/renovar cobrança.",
      userId: params.userId,
      clinicId: params.clinicId,
    });
    throw err;
  }
}

export async function getSubscriptionPageData(clinicId: string, page = 1, pageSize = 12) {
  const cfg = getSyncPayConfig();
  const subscription = await prisma.clinicSubscription.findUnique({
    where: { clinicId_provider: { clinicId, provider: "syncpay" } },
  });

  if (!subscription) {
    return {
      configured: Boolean(
        cfg.baseUrl && cfg.clientId && cfg.clientSecret && cfg.monthlyAmount && cfg.planToken
      ),
      subscription: null,
      charges: [] as Awaited<ReturnType<typeof prisma.subscriptionCharge.findMany>>,
      totalCharges: 0,
      page,
      pageSize,
      currentCharge: null,
      lastPaidCharge: null,
      checkoutUrl: null as string | null,
      amount: cfg.monthlyAmount,
      gracePeriodDays: cfg.graceDays,
    };
  }

  try {
    await syncSubscriptionFromProvider(subscription.id);
  } catch {
    // Mantém dados locais.
  }

  const fresh = await prisma.clinicSubscription.findUniqueOrThrow({
    where: { id: subscription.id },
  });

  const [totalCharges, charges, currentCharge, lastPaidCharge] = await Promise.all([
    prisma.subscriptionCharge.count({ where: { subscriptionId: fresh.id } }),
    prisma.subscriptionCharge.findMany({
      where: { subscriptionId: fresh.id },
      orderBy: { cycleNumber: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.subscriptionCharge.findFirst({
      where: { subscriptionId: fresh.id },
      orderBy: { cycleNumber: "desc" },
    }),
    prisma.subscriptionCharge.findFirst({
      where: { subscriptionId: fresh.id, status: "paid" },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  return {
    configured: true,
    subscription: fresh,
    charges,
    totalCharges,
    page,
    pageSize,
    currentCharge,
    lastPaidCharge,
    checkoutUrl: fresh.checkoutUrl,
    amount: fresh.amount,
    gracePeriodDays: fresh.gracePeriodDays,
  };
}

export async function markChargePaidLocal(params: {
  subscriptionToken?: string | null;
  cycleNumber?: number | null;
  providerChargeId?: string | null;
  paidAt?: Date | null;
  amount?: number | null;
}) {
  let subscription = params.subscriptionToken
    ? await prisma.clinicSubscription.findUnique({
        where: { providerSubscriptionToken: params.subscriptionToken },
      })
    : null;

  if (!subscription && params.providerChargeId) {
    const charge = await prisma.subscriptionCharge.findFirst({
      where: { providerChargeId: params.providerChargeId },
      include: { subscription: true },
    });
    subscription = charge?.subscription ?? null;
  }

  if (!subscription) return null;

  if (params.cycleNumber != null) {
    const charge = await prisma.subscriptionCharge.findUnique({
      where: {
        subscriptionId_cycleNumber: {
          subscriptionId: subscription.id,
          cycleNumber: params.cycleNumber,
        },
      },
    });
    if (charge && charge.status !== "paid") {
      await prisma.subscriptionCharge.update({
        where: { id: charge.id },
        data: {
          status: "paid",
          paidAt: params.paidAt ?? new Date(),
        },
      });
    }
  } else if (params.providerChargeId) {
    await prisma.subscriptionCharge.updateMany({
      where: {
        subscriptionId: subscription.id,
        providerChargeId: params.providerChargeId,
        status: { not: "paid" },
      },
      data: {
        status: "paid",
        paidAt: params.paidAt ?? new Date(),
      },
    });
  } else {
    const pending = await prisma.subscriptionCharge.findFirst({
      where: { subscriptionId: subscription.id, status: { in: ["pending", "expired"] } },
      orderBy: { cycleNumber: "desc" },
    });
    if (pending) {
      await prisma.subscriptionCharge.update({
        where: { id: pending.id },
        data: { status: "paid", paidAt: params.paidAt ?? new Date() },
      });
    }
  }

  await prisma.clinicSubscription.update({
    where: { id: subscription.id },
    data: {
      lastPaidAt: params.paidAt ?? new Date(),
      status: subscription.status === "cancelled" ? subscription.status : "active",
    },
  });

  await safeAudit({
    action: "PAYMENT_CONFIRMED",
    entityId: subscription.id,
    details: "Pagamento confirmado.",
    clinicId: subscription.clinicId,
  });

  return subscription;
}

export async function applySubscriptionStatusFromWebhook(params: {
  subscriptionToken?: string | null;
  status?: string | null;
}) {
  if (!params.subscriptionToken || !params.status) return null;
  const mapped =
    params.status === "assinatura_ativada"
      ? "active"
      : params.status === "assinatura_em_atraso"
        ? "overdue"
        : params.status === "assinatura_suspensa"
          ? "suspended"
          : params.status === "assinatura_cancelada"
            ? "cancelled"
            : params.status === "assinatura_reativada"
              ? "active"
              : params.status;

  const allowed = ["pending_first_payment", "active", "overdue", "suspended", "cancelled"];
  if (!allowed.includes(mapped)) return null;

  const sub = await prisma.clinicSubscription.findUnique({
    where: { providerSubscriptionToken: params.subscriptionToken },
  });
  if (!sub) return null;

  const updated = await prisma.clinicSubscription.update({
    where: { id: sub.id },
    data: { status: mapped },
  });

  await safeAudit({
    action: "STATUS_CHANGE",
    entityId: sub.id,
    details: `Status da assinatura atualizado para ${mapped}.`,
    clinicId: sub.clinicId,
  });

  return updated;
}
