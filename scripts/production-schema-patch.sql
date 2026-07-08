-- Idempotent schema patches for production DB (created via db push, no migration history).
-- Safe to run multiple times.

-- Enum extensions run separately via production-schema-patch-enums.sql

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

-- === Pre-referral operations (v2) ===
ALTER TABLE "PublicReferralRequest" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'site_pre_referral';
ALTER TABLE "PublicReferralRequest" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE "PublicReferralRequest" ADD COLUMN IF NOT EXISTS "convertedReferralId" TEXT;

DO $$ BEGIN
  ALTER TABLE "PublicReferralRequest"
    ADD CONSTRAINT "PublicReferralRequest_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

-- === Appointment operations ===
UPDATE "Appointment" SET status = 'CONCLUIDO' WHERE status = 'REALIZADO';

DO $$ BEGIN
  CREATE TYPE "AppointmentHistoryAction" AS ENUM (
    'CREATED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'NO_SHOW',
    'ATTENDANCE_STARTED', 'COMPLETED', 'NOTE_ADDED', 'STATUS_CHANGED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "protocol" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "endAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "clinicalExamType" "ClinicalExamType";
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attendanceNotes" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "professionalId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "roomName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;

DO $$ BEGIN
  ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AppointmentExam" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "status" "ReferralExamStatus" NOT NULL DEFAULT 'PENDENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppointmentExam_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppointmentExam_appointmentId_examId_key"
  ON "AppointmentExam"("appointmentId", "examId");

DO $$ BEGIN
  ALTER TABLE "AppointmentExam"
    ADD CONSTRAINT "AppointmentExam_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AppointmentExam"
    ADD CONSTRAINT "AppointmentExam_examId_fkey"
    FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AppointmentHistory" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "action" "AppointmentHistoryAction" NOT NULL,
    "fromStatus" "AppointmentStatus",
    "toStatus" "AppointmentStatus",
    "notes" TEXT,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppointmentHistory_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "AppointmentHistory"
    ADD CONSTRAINT "AppointmentHistory_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AppointmentHistory"
    ADD CONSTRAINT "AppointmentHistory_performedByUserId_fkey"
    FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === Company operations ===
UPDATE "Company" SET status = 'ATIVA' WHERE status = 'ACTIVE';
UPDATE "Company" SET status = 'INATIVA' WHERE status = 'INACTIVE';

DO $$ BEGIN
  CREATE TYPE "CompanySize" AS ENUM ('PEQUENA', 'MEDIA', 'GRANDE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyContractType" AS ENUM ('AVULSO', 'MENSAL', 'ANUAL', 'EM_NEGOCIACAO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyContactType" AS ENUM ('SITE', 'WHATSAPP', 'TELEFONE', 'EMAIL', 'VISITA', 'COMERCIAL', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyHistoryAction" AS ENUM (
    'CREATED', 'UPDATED', 'STATUS_CHANGED', 'EMPLOYEE_ADDED', 'REFERRAL_CREATED',
    'QUOTE_SENT', 'DOCUMENT_ATTACHED', 'PORTAL_ENABLED', 'PORTAL_DISABLED', 'USER_CREATED', 'CONTACT_ADDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "stateRegistration" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "size" "CompanySize";
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "segment" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "responsibleRole" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "contractType" "CompanyContractType";
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "portalEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "quoteNumber" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "serviceTitle" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "CompanyContact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "CompanyContactType" NOT NULL,
    "title" TEXT,
    "notes" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyContact_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "CompanyContact"
    ADD CONSTRAINT "CompanyContact_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CompanyContact"
    ADD CONSTRAINT "CompanyContact_performedByUserId_fkey"
    FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CompanyHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "action" "CompanyHistoryAction" NOT NULL,
    "notes" TEXT,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyHistory_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "CompanyHistory"
    ADD CONSTRAINT "CompanyHistory_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CompanyHistory"
    ADD CONSTRAINT "CompanyHistory_performedByUserId_fkey"
    FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === Collaborator (Patient) operations ===
UPDATE "Patient" SET status = 'ATIVO' WHERE status = 'ACTIVE';
UPDATE "Patient" SET status = 'INATIVO' WHERE status = 'INACTIVE';

DO $$ BEGIN
  CREATE TYPE "PatientHistoryAction" AS ENUM (
    'CREATED', 'UPDATED', 'STATUS_CHANGED', 'REFERRAL_CREATED', 'APPOINTMENT_SCHEDULED',
    'ATTENDANCE_STARTED', 'ATTENDANCE_COMPLETED', 'DOCUMENT_ATTACHED', 'ASO_AVAILABLE', 'COMPANY_LINKED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "admissionDate" TIMESTAMP(3);
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "nextPeriodicDate" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PatientHistory" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "action" "PatientHistoryAction" NOT NULL,
    "notes" TEXT,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatientHistory_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "PatientHistory"
    ADD CONSTRAINT "PatientHistory_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PatientHistory"
    ADD CONSTRAINT "PatientHistory_performedByUserId_fkey"
    FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === Exam catalog ===
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

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Exam' AND column_name = 'preparation'
  ) THEN
    UPDATE "Exam" SET "preparationBefore" = COALESCE("preparationBefore", "preparation") WHERE "preparation" IS NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Exam' AND column_name = 'deliveryTime'
  ) THEN
    UPDATE "Exam" SET "averageDeadline" = COALESCE("averageDeadline", "deliveryTime") WHERE "deliveryTime" IS NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Exam' AND column_name = 'notes'
  ) THEN
    UPDATE "Exam" SET "observations" = COALESCE("observations", "notes") WHERE "notes" IS NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Exam' AND column_name = 'active'
  ) THEN
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

-- === Commercial / Quotes ===
DO $$ BEGIN
  CREATE TYPE "QuoteStatus" AS ENUM (
    'RASCUNHO', 'EM_ANALISE', 'ENVIADO', 'AGUARDANDO_RESPOSTA',
    'APROVADO', 'RECUSADO', 'EXPIRADO', 'CANCELADO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommercialEntityType" AS ENUM ('LEAD', 'QUOTE', 'CONTACT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommercialHistoryAction" AS ENUM (
    'CREATED', 'STATUS_CHANGED', 'NOTE_ADDED', 'WHATSAPP_OPENED', 'EMAIL_SENT',
    'QUOTE_CREATED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'QUOTE_REJECTED', 'QUOTE_DUPLICATED',
    'COMPANY_LINKED', 'REFERRAL_CREATED', 'PORTAL_ENABLED', 'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "QuoteRejectReason" AS ENUM (
    'VALOR', 'SEM_RESPOSTA', 'OUTRO_FORNECEDOR', 'SEM_INTERESSE', 'OUTRO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "serviceInterest" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'site';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "sourcePage" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "interestType" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "contactMessageId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "convertedQuoteId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Lead_convertedQuoteId_key" ON "Lead"("convertedQuoteId");

ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "sourcePage" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "serviceInterest" TEXT;

CREATE TABLE IF NOT EXISTS "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "companyId" TEXT,
    "companyName" TEXT NOT NULL,
    "responsibleName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "cnpj" TEXT,
    "city" TEXT,
    "state" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'RASCUNHO',
    "totalAmount" DOUBLE PRECISION,
    "validUntil" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "internalNotes" TEXT,
    "clientNotes" TEXT,
    "rejectReason" "QuoteRejectReason",
    "rejectNotes" TEXT,
    "sourceLeadId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

CREATE TABLE IF NOT EXISTS "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "notes" TEXT,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialHistory" (
    "id" TEXT NOT NULL,
    "entityType" "CommercialEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "CommercialHistoryAction" NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "notes" TEXT,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommercialHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialNote" (
    "id" TEXT NOT NULL,
    "entityType" "CommercialEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommercialNote_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Quote" ADD CONSTRAINT "Quote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Quote" ADD CONSTRAINT "Quote_sourceLeadId_fkey" FOREIGN KEY ("sourceLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Lead" ADD CONSTRAINT "Lead_convertedQuoteId_fkey" FOREIGN KEY ("convertedQuoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CommercialHistory" ADD CONSTRAINT "CommercialHistory_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CommercialNote" ADD CONSTRAINT "CommercialNote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- === Document operations ===
DO $$ BEGIN CREATE TYPE "DocumentHistoryAction" AS ENUM ('CREATED','FILE_ATTACHED','FILE_REPLACED','STATUS_CHANGED','DOWNLOADED','VIEWED','SENT','ARCHIVED','PORTAL_ENABLED','PORTAL_DISABLED','DELETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DocumentAccessAction" AS ENUM ('VIEW','DOWNLOAD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "fileMimeType" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "examId" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "quoteId" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "issuedAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "sensitive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "availableOnPortal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "uploadedByUserId" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "asoClinicalType" "ClinicalExamType";
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "asoExamDate" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "asoProfessionalName" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "clientNotes" TEXT;

UPDATE "Document" SET "status" = 'EM_EMISSAO' WHERE "status"::text = 'EM_ELABORACAO';
UPDATE "Document" SET "status" = 'DISPONIVEL' WHERE "status"::text IN ('CONCLUIDO', 'EM_DIA', 'ENTREGUE');

CREATE TABLE IF NOT EXISTS "DocumentHistory" (
    "id" TEXT NOT NULL, "documentId" TEXT NOT NULL, "action" "DocumentHistoryAction" NOT NULL,
    "notes" TEXT, "performedByUserId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentHistory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "DocumentAccessLog" (
    "id" TEXT NOT NULL, "documentId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "action" "DocumentAccessAction" NOT NULL, "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentAccessLog_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN ALTER TABLE "Document" ADD CONSTRAINT "Document_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Document" ADD CONSTRAINT "Document_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DocumentHistory" ADD CONSTRAINT "DocumentHistory_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DocumentHistory" ADD CONSTRAINT "DocumentHistory_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
