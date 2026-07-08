-- Phase 1: Product repositioning — multi-clinic tenant base + new roles

-- New enums
DO $$ BEGIN
  CREATE TYPE "ClinicStatus" AS ENUM ('ATIVA', 'TRIAL', 'SUSPENSA', 'CANCELADA', 'BLOQUEADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ClinicPlan" AS ENUM ('TRIAL', 'BASICO', 'PROFISSIONAL', 'ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Clinic table
CREATE TABLE IF NOT EXISTS "Clinic" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" "ClinicStatus" NOT NULL DEFAULT 'ATIVA',
  "plan" "ClinicPlan" NOT NULL DEFAULT 'TRIAL',
  "responsibleName" TEXT,
  "email" TEXT,
  "whatsapp" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Clinic_slug_key" ON "Clinic"("slug");

-- Default clinic for existing data
INSERT INTO "Clinic" ("id", "name", "slug", "status", "plan", "responsibleName", "email", "whatsapp", "updatedAt")
VALUES (
  'clinic_default_unimetra',
  'Unimetra',
  'unimetra',
  'ATIVA',
  'PROFISSIONAL',
  'Administrador',
  'contato@unimetra.com.br',
  '5599992033813',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO NOTHING;

-- clinicId columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "externalSystemReference" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "PublicReferralRequest" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;

-- Backfill clinicId
UPDATE "User" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL AND "role" != 'SUPER_ADMIN';
UPDATE "Company" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;
UPDATE "Patient" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;
UPDATE "Exam" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;
UPDATE "Referral" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;
UPDATE "Appointment" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;
UPDATE "Lead" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;
UPDATE "Quote" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;
UPDATE "Document" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;
UPDATE "AuditLog" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;
UPDATE "PublicReferralRequest" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;
UPDATE "ContactMessage" SET "clinicId" = 'clinic_default_unimetra' WHERE "clinicId" IS NULL;

-- Migrate legacy roles to new roles
UPDATE "User" SET "role" = 'CLINIC_ADMIN' WHERE "role" = 'ADMIN';
UPDATE "User" SET "role" = 'RECEPTION' WHERE "role" = 'RECEPCAO';
UPDATE "User" SET "role" = 'HEALTH_PROFESSIONAL' WHERE "role" = 'MEDICO';
UPDATE "User" SET "role" = 'SST_TECHNICIAN' WHERE "role" = 'TECNICO';
UPDATE "User" SET "role" = 'FINANCIAL' WHERE "role" = 'FINANCEIRO';
UPDATE "User" SET "role" = 'COMPANY_HR' WHERE "role" = 'EMPRESA';
UPDATE "User" SET "role" = 'READ_ONLY' WHERE "role" = 'VISUALIZADOR';

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Company" ADD CONSTRAINT "Company_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Exam" ADD CONSTRAINT "Exam_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Referral" ADD CONSTRAINT "Referral_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Document" ADD CONSTRAINT "Document_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PublicReferralRequest" ADD CONSTRAINT "PublicReferralRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "User_clinicId_idx" ON "User"("clinicId");
CREATE INDEX IF NOT EXISTS "Company_clinicId_idx" ON "Company"("clinicId");
CREATE INDEX IF NOT EXISTS "Referral_clinicId_idx" ON "Referral"("clinicId");
CREATE INDEX IF NOT EXISTS "Document_clinicId_idx" ON "Document"("clinicId");
