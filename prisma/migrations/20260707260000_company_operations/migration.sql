-- CompanyStatus migration
ALTER TYPE "CompanyStatus" ADD VALUE IF NOT EXISTS 'ATIVA';
ALTER TYPE "CompanyStatus" ADD VALUE IF NOT EXISTS 'INATIVA';
ALTER TYPE "CompanyStatus" ADD VALUE IF NOT EXISTS 'PENDENTE';
ALTER TYPE "CompanyStatus" ADD VALUE IF NOT EXISTS 'BLOQUEADA';

UPDATE "Company" SET status = 'ATIVA' WHERE status::text = 'ACTIVE';
UPDATE "Company" SET status = 'INATIVA' WHERE status::text = 'INACTIVE';

-- New enums
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

-- Company columns
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "stateRegistration" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "size" "CompanySize";
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "segment" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "responsibleRole" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "contractType" "CompanyContractType";
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "portalEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Company" ALTER COLUMN "status" SET DEFAULT 'ATIVA';

-- Document extensions
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'PGR';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'CONTRATO';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'PROPOSTA';
ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'EM_DIA';
ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'VENCIDO';
ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'ARQUIVADO';
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);

-- Lead extensions
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'EXPIRADO';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "quoteNumber" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "serviceTitle" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);

-- CompanyContact
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

-- CompanyHistory
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
