-- Extend PreReferralStatus
ALTER TYPE "PreReferralStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_RETORNO';
ALTER TYPE "PreReferralStatus" ADD VALUE IF NOT EXISTS 'DUPLICADO';

-- PublicReferralRequest extensions
ALTER TABLE "PublicReferralRequest" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'site_pre_referral';
ALTER TABLE "PublicReferralRequest" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE "PublicReferralRequest" ADD COLUMN IF NOT EXISTS "convertedReferralId" TEXT;

DO $$ BEGIN
  ALTER TABLE "PublicReferralRequest"
    ADD CONSTRAINT "PublicReferralRequest_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PreReferralHistory
CREATE TABLE IF NOT EXISTS "PreReferralHistory" (
    "id" TEXT NOT NULL,
    "preReferralId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "PreReferralStatus",
    "toStatus" "PreReferralStatus",
    "notes" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PreReferralHistory_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "PreReferralHistory"
    ADD CONSTRAINT "PreReferralHistory_preReferralId_fkey"
    FOREIGN KEY ("preReferralId") REFERENCES "PublicReferralRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PreReferralHistory"
    ADD CONSTRAINT "PreReferralHistory_performedById_fkey"
    FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
