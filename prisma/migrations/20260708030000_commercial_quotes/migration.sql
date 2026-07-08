-- Commercial / Quotes module

ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'EM_ANALISE';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_RETORNO';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'CONVERTIDO_ORCAMENTO';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'ARQUIVADO';

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

DO $$ BEGIN
  ALTER TABLE "Lead"
    ADD CONSTRAINT "Lead_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

DO $$ BEGIN
  ALTER TABLE "Quote"
    ADD CONSTRAINT "Quote_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Quote"
    ADD CONSTRAINT "Quote_sourceLeadId_fkey"
    FOREIGN KEY ("sourceLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Quote"
    ADD CONSTRAINT "Quote_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Lead"
    ADD CONSTRAINT "Lead_convertedQuoteId_fkey"
    FOREIGN KEY ("convertedQuoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

DO $$ BEGIN
  ALTER TABLE "QuoteItem"
    ADD CONSTRAINT "QuoteItem_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

DO $$ BEGIN
  ALTER TABLE "CommercialHistory"
    ADD CONSTRAINT "CommercialHistory_performedByUserId_fkey"
    FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
  ALTER TABLE "CommercialNote"
    ADD CONSTRAINT "CommercialNote_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
