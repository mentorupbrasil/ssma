-- SyncPay SaaS subscription (manual Pix / qr_code)

CREATE TABLE IF NOT EXISTS "ClinicSubscription" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'syncpay',
    "providerPlanToken" TEXT NOT NULL,
    "providerSubscriptionToken" TEXT NOT NULL,
    "billingMethod" TEXT NOT NULL DEFAULT 'qr_code',
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_first_payment',
    "nextDueAt" TIMESTAMP(3),
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 5,
    "checkoutUrl" TEXT,
    "lastPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClinicSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClinicSubscription_providerSubscriptionToken_key"
  ON "ClinicSubscription"("providerSubscriptionToken");

CREATE UNIQUE INDEX IF NOT EXISTS "ClinicSubscription_clinicId_provider_key"
  ON "ClinicSubscription"("clinicId", "provider");

CREATE INDEX IF NOT EXISTS "ClinicSubscription_status_idx"
  ON "ClinicSubscription"("status");

CREATE INDEX IF NOT EXISTS "ClinicSubscription_nextDueAt_idx"
  ON "ClinicSubscription"("nextDueAt");

CREATE TABLE IF NOT EXISTS "SubscriptionCharge" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "providerChargeId" TEXT,
    "cycleNumber" INTEGER NOT NULL,
    "competence" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "pixCode" TEXT,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubscriptionCharge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionCharge_subscriptionId_cycleNumber_key"
  ON "SubscriptionCharge"("subscriptionId", "cycleNumber");

CREATE INDEX IF NOT EXISTS "SubscriptionCharge_subscriptionId_status_idx"
  ON "SubscriptionCharge"("subscriptionId", "status");

CREATE INDEX IF NOT EXISTS "SubscriptionCharge_providerChargeId_idx"
  ON "SubscriptionCharge"("providerChargeId");

CREATE INDEX IF NOT EXISTS "SubscriptionCharge_dueDate_idx"
  ON "SubscriptionCharge"("dueDate");

CREATE TABLE IF NOT EXISTS "ProviderWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'syncpay',
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "ProviderWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProviderWebhookEvent_provider_providerEventId_key"
  ON "ProviderWebhookEvent"("provider", "providerEventId");

CREATE INDEX IF NOT EXISTS "ProviderWebhookEvent_eventType_receivedAt_idx"
  ON "ProviderWebhookEvent"("eventType", "receivedAt");

CREATE INDEX IF NOT EXISTS "ProviderWebhookEvent_processingStatus_idx"
  ON "ProviderWebhookEvent"("processingStatus");

CREATE TABLE IF NOT EXISTS "SyncPayAuthCache" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "accessToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SyncPayAuthCache_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ClinicSubscription"
    ADD CONSTRAINT "ClinicSubscription_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SubscriptionCharge"
    ADD CONSTRAINT "SubscriptionCharge_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "ClinicSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
