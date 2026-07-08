-- Exam catalog expansion

DO $$ BEGIN
  CREATE TYPE "ExamStatus" AS ENUM ('ATIVO', 'INATIVO', 'EM_REVISAO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExamPreparationType" AS ENUM (
    'SEM_PREPARO', 'PREPARO_NECESSARIO', 'JEJUM_NECESSARIO',
    'ATENCAO_ESPECIAL', 'VERIFICAR_EXAME', 'ORIENTACAO_ESPECIFICA'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExamDeadlineType" AS ENUM (
    'NO_DIA', 'DIAS_UTEIS', 'CONFORME_AGENDAMENTO', 'CONFORME_LABORATORIO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExamHistoryAction" AS ENUM (
    'CREATED', 'UPDATED', 'PREPARATION_CHANGED', 'DEADLINE_CHANGED',
    'STATUS_CHANGED', 'PUBLISHED', 'UNPUBLISHED', 'DUPLICATED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "ExamCategory" ADD VALUE IF NOT EXISTS 'CLINICO_OCUPACIONAL';
ALTER TYPE "ExamCategory" ADD VALUE IF NOT EXISTS 'IMAGEM';
ALTER TYPE "ExamCategory" ADD VALUE IF NOT EXISTS 'TOXICOLOGICO';
ALTER TYPE "ExamCategory" ADD VALUE IF NOT EXISTS 'AVALIACAO_ESPECIALIZADA';

ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "shortDescription" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "preparationType" "ExamPreparationType" NOT NULL DEFAULT 'SEM_PREPARO';
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "preparationBefore" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "instructionsOnDay" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "averageDeadline" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "deadlineType" "ExamDeadlineType";
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "observations" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "whenToNotifyClinic" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "requiresAppointment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "requiresProfessional" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "requiresAttachment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "showOnWebsite" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "availableOnPublicForm" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "availableOnCompanyPortal" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "internalTags" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "status" "ExamStatus" NOT NULL DEFAULT 'ATIVO';

-- Migrate legacy columns
UPDATE "Exam" SET "preparationBefore" = COALESCE("preparationBefore", "preparation") WHERE "preparation" IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Exam' AND column_name = 'preparation');
UPDATE "Exam" SET "averageDeadline" = COALESCE("averageDeadline", "deliveryTime") WHERE "deliveryTime" IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Exam' AND column_name = 'deliveryTime');
UPDATE "Exam" SET "observations" = COALESCE("observations", "notes") WHERE "notes" IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Exam' AND column_name = 'notes');

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Exam' AND column_name = 'active') THEN
    UPDATE "Exam" SET "status" = CASE WHEN "active" = false THEN 'INATIVO'::"ExamStatus" ELSE 'ATIVO'::"ExamStatus" END;
  END IF;
END $$;

UPDATE "Exam" SET category = 'CLINICO_OCUPACIONAL' WHERE category::text = 'CLINICO';
UPDATE "Exam" SET category = 'TOXICOLOGICO' WHERE slug = 'toxicologico';
UPDATE "Exam" SET category = 'AVALIACAO_ESPECIALIZADA' WHERE slug = 'avaliacao-psicologica';
UPDATE "Exam" SET category = 'IMAGEM' WHERE slug IN ('radiografias', 'tomografia');

ALTER TABLE "Exam" DROP COLUMN IF EXISTS "preparation";
ALTER TABLE "Exam" DROP COLUMN IF EXISTS "deliveryTime";
ALTER TABLE "Exam" DROP COLUMN IF EXISTS "notes";
ALTER TABLE "Exam" DROP COLUMN IF EXISTS "active";

CREATE TABLE IF NOT EXISTS "ExamHistory" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "action" "ExamHistoryAction" NOT NULL,
    "notes" TEXT,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamHistory_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ExamHistory"
    ADD CONSTRAINT "ExamHistory_examId_fkey"
    FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ExamHistory"
    ADD CONSTRAINT "ExamHistory_performedByUserId_fkey"
    FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
