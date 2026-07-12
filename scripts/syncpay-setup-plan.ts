/**
 * Configuração inicial única do plano SyncPay (Assinatura Unimetra).
 *
 * Uso:
 *   npx tsx scripts/syncpay-setup-plan.ts
 *
 * Não executar em toda inicialização/deploy.
 */
import "dotenv/config";
import { ensureUnimetraPlan } from "../src/lib/syncpay/ensure-plan";
import { createPartnerWebhook, listPartnerWebhooks } from "../src/lib/syncpay/api";
import { SYNCPAY_SUBSCRIPTION_EVENTS } from "../src/lib/syncpay/types";

async function main() {
  const plan = await ensureUnimetraPlan();
  console.log("Plano SyncPay pronto.");
  console.log(`SYNCPAY_PLAN_TOKEN=${plan.token}`);
  console.log(`checkout_url=${plan.checkout_url}`);
  console.log(`amount=${plan.amount} billing_method=${plan.billing_method}`);

  const appUrl = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  if (!appUrl || appUrl.includes("localhost")) {
    console.log(
      "\nDefina AUTH_URL público (HTTPS) para registrar webhooks automaticamente."
    );
    console.log("URL do webhook: https://SEU_DOMINIO/api/webhooks/syncpay");
    return;
  }

  const webhookUrl = `${appUrl}/api/webhooks/syncpay`;
  console.log(`\nRegistrando webhooks em ${webhookUrl} ...`);

  for (const event of SYNCPAY_SUBSCRIPTION_EVENTS) {
    try {
      await createPartnerWebhook({
        title: `Unimetra — ${event}`,
        url: webhookUrl,
        event,
        trigger_all_products: true,
      });
      console.log(`Webhook criado: ${event}`);
    } catch {
      console.log(`Webhook já existente ou falha ao criar: ${event}`);
    }
  }

  try {
    const listed = await listPartnerWebhooks();
    const tokens = (listed.data ?? [])
      .filter((w) => w.url === webhookUrl && w.token)
      .map((w) => w.token as string);
    const unique = [...new Set(tokens)];
    if (unique.length === 1) {
      console.log(`\nSYNCPAY_WEBHOOK_TOKEN=${unique[0]}`);
    } else if (unique.length > 1) {
      console.log("\nTokens de webhook encontrados (use o da SyncPay no .env):");
      unique.forEach((t) => console.log(`  ${t}`));
    } else {
      console.log(
        "\nNão foi possível ler o token do webhook na listagem. Copie o token no painel SyncPay e configure SYNCPAY_WEBHOOK_TOKEN."
      );
    }
  } catch {
    console.log(
      "\nConfigure SYNCPAY_WEBHOOK_TOKEN com o token Bearer enviado nos webhooks da SyncPay."
    );
  }
}

main().catch((err) => {
  console.error("Falha na configuração SyncPay:", err instanceof Error ? err.message : err);
  process.exit(1);
});
