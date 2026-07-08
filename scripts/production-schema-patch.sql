-- Idempotent schema patches for production DB (created via db push, no migration history).
-- Safe to run multiple times.

-- === Enums (ReferralStatus extensions) ===
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_RESULTADO';
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_DOCUMENTO';
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'ASO_DISPONIVEL';

DO $$ BEGIN
  CREATE TYPE "PreReferralClinicalExamType" AS ENUM (
    'ADMISSIONAL', 'DEMISSIONAL', 'PERIODICO', 'RETORNO_TRABALHO', 'MUDANCA_FUNCAO', 'NAO_SEI_INFORMAR'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExamSelectionMode" AS ENUM ('NAO_SEI', 'SELECIONAR', 'ANEXAR_FUTURO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PreReferralStatus" AS ENUM ('NOVO', 'EM_ANALISE', 'CONVERTIDO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContactMessageStatus" AS ENUM ('NOVO', 'EM_ANALISE', 'RESPONDIDO', 'ARQUIVADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReferralSource" AS ENUM ('PORTAL', 'ADMIN', 'PRE_REFERRAL', 'SITE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReferralExamStatus" AS ENUM (
    'PENDENTE', 'AGENDADO', 'REALIZADO', 'RESULTADO_DISPONIVEL', 'CANCELADO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReferralDocumentType" AS ENUM ('ASO', 'GUIA', 'LAUDO', 'RESULTADO', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === PublicReferralRequest ===
CREATE TABLE IF NOT EXISTS "PublicReferralRequest" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyDocument" TEXT,
    "responsibleName" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "employeeName" TEXT NOT NULL,
    "employeeDocument" TEXT,
    "employeeRole" TEXT NOT NULL,
    "clinicalExamType" "PreReferralClinicalExamType" NOT NULL,
    "examSelectionMode" "ExamSelectionMode" NOT NULL,
    "selectedExams" TEXT[],
    "notes" TEXT,
    "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "status" "PreReferralStatus" NOT NULL DEFAULT 'NOVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicReferralRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PublicReferralRequest_protocol_key"
  ON "PublicReferralRequest"("protocol");

-- === ContactMessage ===
CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'site_contato',
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NOVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- === Referral columns ===
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "preReferralId" TEXT;

-- Migrate Referral.source from TEXT to ReferralSource enum when needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Referral' AND column_name = 'source'
      AND udt_name <> 'ReferralSource'
  ) THEN
    ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "sourceNew" "ReferralSource" NOT NULL DEFAULT 'SITE';

    UPDATE "Referral" SET "sourceNew" = CASE
      WHEN "source"::text = 'portal' THEN 'PORTAL'::"ReferralSource"
      WHEN "source"::text = 'dashboard' THEN 'ADMIN'::"ReferralSource"
      WHEN "source"::text = 'seed' THEN 'ADMIN'::"ReferralSource"
      WHEN "source"::text = 'PRE_REFERRAL' THEN 'PRE_REFERRAL'::"ReferralSource"
      WHEN "source"::text = 'ADMIN' THEN 'ADMIN'::"ReferralSource"
      WHEN "source"::text = 'PORTAL' THEN 'PORTAL'::"ReferralSource"
      ELSE 'SITE'::"ReferralSource"
    END;

    ALTER TABLE "Referral" DROP COLUMN "source";
    ALTER TABLE "Referral" RENAME COLUMN "sourceNew" TO "source";
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Referral' AND column_name = 'source'
  ) THEN
    ALTER TABLE "Referral" ADD COLUMN "source" "ReferralSource" NOT NULL DEFAULT 'SITE';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Referral_preReferralId_key" ON "Referral"("preReferralId");

DO $$ BEGIN
  ALTER TABLE "Referral"
    ADD CONSTRAINT "Referral_preReferralId_fkey"
    FOREIGN KEY ("preReferralId") REFERENCES "PublicReferralRequest"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === ReferralExam columns (with defaults for existing rows) ===
ALTER TABLE "ReferralExam" ADD COLUMN IF NOT EXISTS "status" "ReferralExamStatus" NOT NULL DEFAULT 'PENDENTE';
ALTER TABLE "ReferralExam" ADD COLUMN IF NOT EXISTS "resultAvailableAt" TIMESTAMP(3);
ALTER TABLE "ReferralExam" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- === ReferralStatusHistory ===
CREATE TABLE IF NOT EXISTS "ReferralStatusHistory" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "fromStatus" "ReferralStatus",
    "toStatus" "ReferralStatus" NOT NULL,
    "notes" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralStatusHistory_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ReferralStatusHistory"
    ADD CONSTRAINT "ReferralStatusHistory_referralId_fkey"
    FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ReferralStatusHistory"
    ADD CONSTRAINT "ReferralStatusHistory_changedById_fkey"
    FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === ReferralDocument ===
CREATE TABLE IF NOT EXISTS "ReferralDocument" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "type" "ReferralDocumentType" NOT NULL DEFAULT 'OUTRO',
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralDocument_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ReferralDocument"
    ADD CONSTRAINT "ReferralDocument_referralId_fkey"
    FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ReferralDocument"
    ADD CONSTRAINT "ReferralDocument_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
