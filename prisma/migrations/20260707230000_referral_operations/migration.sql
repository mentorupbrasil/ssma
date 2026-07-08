-- Extend ReferralStatus
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_RESULTADO';
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_DOCUMENTO';
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'ASO_DISPONIVEL';

-- CreateEnum
CREATE TYPE "ReferralSource" AS ENUM ('PORTAL', 'ADMIN', 'PRE_REFERRAL', 'SITE');
CREATE TYPE "ReferralExamStatus" AS ENUM ('PENDENTE', 'AGENDADO', 'REALIZADO', 'RESULTADO_DISPONIVEL', 'CANCELADO');
CREATE TYPE "ReferralDocumentType" AS ENUM ('ASO', 'GUIA', 'LAUDO', 'RESULTADO', 'OUTRO');

-- Referral: migrate source column
ALTER TABLE "Referral" ADD COLUMN "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Referral" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "Referral" ADD COLUMN "preReferralId" TEXT;
ALTER TABLE "Referral" ADD COLUMN "sourceNew" "ReferralSource" NOT NULL DEFAULT 'SITE';

UPDATE "Referral" SET "sourceNew" = CASE
  WHEN "source" = 'portal' THEN 'PORTAL'::"ReferralSource"
  WHEN "source" = 'dashboard' THEN 'ADMIN'::"ReferralSource"
  WHEN "source" = 'seed' THEN 'ADMIN'::"ReferralSource"
  ELSE 'SITE'::"ReferralSource"
END;

ALTER TABLE "Referral" DROP COLUMN "source";
ALTER TABLE "Referral" RENAME COLUMN "sourceNew" TO "source";

CREATE UNIQUE INDEX "Referral_preReferralId_key" ON "Referral"("preReferralId");
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_preReferralId_fkey" FOREIGN KEY ("preReferralId") REFERENCES "PublicReferralRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ReferralExam
ALTER TABLE "ReferralExam" ADD COLUMN "status" "ReferralExamStatus" NOT NULL DEFAULT 'PENDENTE';
ALTER TABLE "ReferralExam" ADD COLUMN "resultAvailableAt" TIMESTAMP(3);
ALTER TABLE "ReferralExam" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ReferralStatusHistory
CREATE TABLE "ReferralStatusHistory" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "fromStatus" "ReferralStatus",
    "toStatus" "ReferralStatus" NOT NULL,
    "notes" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralStatusHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReferralStatusHistory" ADD CONSTRAINT "ReferralStatusHistory_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralStatusHistory" ADD CONSTRAINT "ReferralStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ReferralDocument
CREATE TABLE "ReferralDocument" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "type" "ReferralDocumentType" NOT NULL DEFAULT 'OUTRO',
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralDocument_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReferralDocument" ADD CONSTRAINT "ReferralDocument_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralDocument" ADD CONSTRAINT "ReferralDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
