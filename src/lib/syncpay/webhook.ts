import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSyncPayConfig } from "@/lib/syncpay/config";
import {
  applySubscriptionStatusFromWebhook,
  markChargePaidLocal,
} from "@/lib/syncpay/subscription-service";
import { SYNCPAY_SUBSCRIPTION_EVENTS } from "@/lib/syncpay/types";

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function validateSyncPayWebhookAuth(authorizationHeader: string | null): boolean {
  const expected = getSyncPayConfig().webhookToken;
  if (!expected) return false;
  if (!authorizationHeader) return false;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() ?? authorizationHeader.trim();
  if (!token) return false;
  return safeEqual(token, expected);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function buildEventId(eventType: string, payload: unknown): string {
  const raw = JSON.stringify(payload);
  return createHash("sha256").update(`${eventType}:${raw}`).digest("hex");
}

function extractEventType(
  headerEvent: string | null,
  body: Record<string, unknown>
): string {
  return (
    pickString(headerEvent, body.event, body.type, body.event_type, body.name) ||
    "unknown"
  );
}

function extractSubscriptionToken(body: Record<string, unknown>): string | null {
  const data = asRecord(body.data) ?? body;
  const subscription = asRecord(data.subscription);
  return pickString(
    data.subscription_token,
    data.token,
    subscription?.token,
    body.subscription_token
  );
}

/**
 * Processa webhook SyncPay de forma idempotente e sem chamadas externas lentas.
 */
export async function processSyncPayWebhook(params: {
  authorizationHeader: string | null;
  headerEvent: string | null;
  body: unknown;
}) {
  if (!validateSyncPayWebhookAuth(params.authorizationHeader)) {
    return { ok: false as const, status: 401 as const, error: "unauthorized" };
  }

  const body = asRecord(params.body) ?? {};
  const eventType = extractEventType(params.headerEvent, body);
  const data = asRecord(body.data) ?? body;
  const explicitId = pickString(
    body.id,
    body.event_id,
    data.id,
    data.event_id,
    asRecord(data.charge)?.id
  );
  const providerEventId = explicitId || buildEventId(eventType, body);

  try {
    await prisma.providerWebhookEvent.create({
      data: {
        provider: "syncpay",
        providerEventId,
        eventType,
        payload: body as object,
        processingStatus: "pending",
      },
    });
  } catch {
    // Já processado (unique) — idempotência.
    return { ok: true as const, status: 200 as const, duplicate: true };
  }

  try {
    const subscriptionToken = extractSubscriptionToken(body);
    const isSubscriptionEvent = (SYNCPAY_SUBSCRIPTION_EVENTS as readonly string[]).includes(
      eventType
    );

    if (isSubscriptionEvent) {
      await applySubscriptionStatusFromWebhook({
        subscriptionToken,
        status: eventType,
      });

      if (eventType === "assinatura_ativada" || eventType === "assinatura_reativada") {
        await markChargePaidLocal({
          subscriptionToken,
          paidAt: new Date(),
        });
      }
    }

    // Cash-in / atualização de cobrança: status completed → pago.
    const status = pickString(data.status, asRecord(data.charge)?.status);
    const chargeId = pickString(
      data.identifier,
      data.id,
      asRecord(data.charge)?.identifier,
      asRecord(data.payment)?.identifier
    );
    const cycleNumberRaw = data.cycle_number ?? asRecord(data.charge)?.cycle_number;
    const cycleNumber =
      typeof cycleNumberRaw === "number"
        ? cycleNumberRaw
        : typeof cycleNumberRaw === "string"
          ? Number.parseInt(cycleNumberRaw, 10)
          : null;

    if (
      status === "completed" ||
      status === "paid" ||
      eventType.includes("paid") ||
      eventType === "cashin.update"
    ) {
      if (status === "completed" || status === "paid") {
        await markChargePaidLocal({
          subscriptionToken,
          providerChargeId: chargeId,
          cycleNumber: Number.isFinite(cycleNumber as number) ? cycleNumber : null,
          paidAt: new Date(),
        });
      }
    }

    // Cobrança criada/atualizada com dados de Pix (sem marcar como paga).
    const charge = asRecord(data.charge);
    if (charge && subscriptionToken && typeof charge.cycle_number === "number") {
      const sub = await prisma.clinicSubscription.findUnique({
        where: { providerSubscriptionToken: subscriptionToken },
      });
      if (sub) {
        const existing = await prisma.subscriptionCharge.findUnique({
          where: {
            subscriptionId_cycleNumber: {
              subscriptionId: sub.id,
              cycleNumber: charge.cycle_number,
            },
          },
        });
        if (!existing || existing.status !== "paid") {
          const payment = asRecord(charge.payment);
          const due =
            typeof charge.due_date === "string"
              ? new Date(
                  /^\d{4}-\d{2}-\d{2}$/.test(charge.due_date)
                    ? `${charge.due_date}T12:00:00`
                    : charge.due_date
                )
              : null;
          const competence =
            due && !Number.isNaN(due.getTime())
              ? `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}`
              : new Date().toISOString().slice(0, 7);

          await prisma.subscriptionCharge.upsert({
            where: {
              subscriptionId_cycleNumber: {
                subscriptionId: sub.id,
                cycleNumber: charge.cycle_number,
              },
            },
            create: {
              subscriptionId: sub.id,
              providerChargeId:
                pickString(charge.identifier, data.identifier) ?? undefined,
              cycleNumber: charge.cycle_number,
              competence,
              amount: typeof charge.amount === "number" ? charge.amount : sub.amount,
              status: pickString(charge.status) || "pending",
              dueDate: due && !Number.isNaN(due.getTime()) ? due : null,
              expiresAt:
                typeof charge.expires_at === "string" ? new Date(charge.expires_at) : null,
              pixCode: pickString(payment?.pix_code),
              qrCode: pickString(payment?.qr_code),
            },
            update: {
              status: existing?.status === "paid" ? "paid" : pickString(charge.status) || "pending",
              amount: typeof charge.amount === "number" ? charge.amount : undefined,
              pixCode: pickString(payment?.pix_code) ?? undefined,
              qrCode: pickString(payment?.qr_code) ?? undefined,
              expiresAt:
                typeof charge.expires_at === "string" ? new Date(charge.expires_at) : undefined,
            },
          });
        }
      }
    }

    await prisma.providerWebhookEvent.update({
      where: { provider_providerEventId: { provider: "syncpay", providerEventId } },
      data: { processingStatus: "processed", processedAt: new Date() },
    });

    return { ok: true as const, status: 200 as const, duplicate: false };
  } catch (err) {
    console.error("[syncpay] webhook processing failed");
    await prisma.providerWebhookEvent
      .update({
        where: { provider_providerEventId: { provider: "syncpay", providerEventId } },
        data: { processingStatus: "failed", processedAt: new Date() },
      })
      .catch(() => null);
    // Ainda retorna 200 para evitar storm de retries agressivos em erros de dados;
    // auth já foi validada. SyncPay exige resposta rápida.
    return { ok: true as const, status: 200 as const, duplicate: false, softFailed: true };
  }
}
