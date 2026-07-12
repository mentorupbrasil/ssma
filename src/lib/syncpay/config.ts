import "server-only";

const PLAN_NAME = "Assinatura Unimetra";
const PLAN_DESCRIPTION = "Licença mensal de uso da plataforma Unimetra";

export function getSyncPayConfig() {
  const baseUrl = (process.env.SYNCPAY_BASE_URL ?? "").replace(/\/$/, "");
  const clientId = process.env.SYNCPAY_CLIENT_ID ?? "";
  const clientSecret = process.env.SYNCPAY_CLIENT_SECRET ?? "";
  const planToken = process.env.SYNCPAY_PLAN_TOKEN ?? "";
  const webhookToken = process.env.SYNCPAY_WEBHOOK_TOKEN ?? "";
  const monthlyAmount = Number.parseInt(process.env.UNIMETRA_MONTHLY_AMOUNT ?? "", 10);
  const graceDays = Number.parseInt(process.env.UNIMETRA_BILLING_GRACE_DAYS ?? "5", 10);
  const enforcementEnabled = process.env.SUBSCRIPTION_ENFORCEMENT_ENABLED === "true";

  return {
    baseUrl,
    clientId,
    clientSecret,
    planToken,
    webhookToken,
    monthlyAmount: Number.isFinite(monthlyAmount) && monthlyAmount > 0 ? monthlyAmount : null,
    graceDays: Number.isFinite(graceDays) && graceDays >= 0 ? graceDays : 5,
    enforcementEnabled,
    planName: PLAN_NAME,
    planDescription: PLAN_DESCRIPTION,
  };
}

export function assertSyncPayConfigured() {
  const cfg = getSyncPayConfig();
  if (!cfg.baseUrl || !cfg.clientId || !cfg.clientSecret) {
    throw new Error("SYNCPAY_NOT_CONFIGURED");
  }
  if (!cfg.monthlyAmount) {
    throw new Error("SYNCPAY_AMOUNT_NOT_CONFIGURED");
  }
  return cfg as typeof cfg & { monthlyAmount: number };
}

export { PLAN_NAME, PLAN_DESCRIPTION };
