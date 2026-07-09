-- CreateEnum
CREATE TYPE "PriceItemCategory" AS ENUM ('EXAME', 'ASO', 'SERVICO', 'PACOTE', 'LAUDO', 'OUTRO');
CREATE TYPE "PriceChargeType" AS ENUM ('AVULSA', 'MENSAL', 'PACOTE', 'CONTRATO', 'CONVENIO');
CREATE TYPE "PriceListStatus" AS ENUM ('ATIVA', 'INATIVA', 'VENCIDA');
CREATE TYPE "ProductionImportStatus" AS ENUM ('RASCUNHO', 'EM_CONFERENCIA', 'COM_DIVERGENCIA', 'CONFERIDO', 'FECHADO', 'CANCELADO');
CREATE TYPE "ProductionImportRowStatus" AS ENUM ('PENDENTE', 'RECONHECIDO', 'SEM_EMPRESA', 'SEM_PRECO', 'DUPLICADO', 'DIVERGENCIA', 'PRONTO');
CREATE TYPE "FinancialEntrySource" AS ENUM ('FECHAMENTO', 'ORCAMENTO', 'AVULSO', 'CONTRATO', 'MANUAL');

-- AlterEnum MonthlyClosingStatus
ALTER TYPE "MonthlyClosingStatus" ADD VALUE IF NOT EXISTS 'EM_CONFERENCIA';
ALTER TYPE "MonthlyClosingStatus" ADD VALUE IF NOT EXISTS 'COM_DIVERGENCIA';
ALTER TYPE "MonthlyClosingStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_APROVACAO';
ALTER TYPE "MonthlyClosingStatus" ADD VALUE IF NOT EXISTS 'PAGO';
ALTER TYPE "MonthlyClosingStatus" ADD VALUE IF NOT EXISTS 'EM_ATRASO';
ALTER TYPE "MonthlyClosingStatus" ADD VALUE IF NOT EXISTS 'CANCELADO';

-- AlterEnum FinancialEntryStatus
ALTER TYPE "FinancialEntryStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_FATURAMENTO';

-- AlterTable MonthlyClosing
ALTER TABLE "MonthlyClosing" ADD COLUMN IF NOT EXISTS "importId" TEXT;
ALTER TABLE "MonthlyClosing" ADD COLUMN IF NOT EXISTS "importedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MonthlyClosing" ADD COLUMN IF NOT EXISTS "withoutPriceCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MonthlyClosing" ADD COLUMN IF NOT EXISTS "divergenceCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable FinancialEntry
ALTER TABLE "FinancialEntry" ADD COLUMN IF NOT EXISTS "source" "FinancialEntrySource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "FinancialEntry" ADD COLUMN IF NOT EXISTS "quoteId" TEXT;
ALTER TABLE "FinancialEntry" ADD COLUMN IF NOT EXISTS "referenceMonth" TIMESTAMP(3);
ALTER TABLE "FinancialEntry" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "FinancialEntry" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;

-- CreateTable PriceListItem
CREATE TABLE IF NOT EXISTS "PriceListItem" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" "PriceItemCategory" NOT NULL DEFAULT 'EXAME',
    "examId" TEXT,
    "defaultPrice" DOUBLE PRECISION NOT NULL,
    "companyId" TEXT,
    "negotiatedPrice" DOUBLE PRECISION,
    "chargeType" "PriceChargeType" NOT NULL DEFAULT 'AVULSA',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "status" "PriceListStatus" NOT NULL DEFAULT 'ATIVA',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PriceListHistory" (
    "id" TEXT NOT NULL,
    "priceListItemId" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION,
    "newPrice" DOUBLE PRECISION,
    "changedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceListHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductionImport" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "referenceMonth" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT,
    "status" "ProductionImportStatus" NOT NULL DEFAULT 'RASCUNHO',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "recognizedRows" INTEGER NOT NULL DEFAULT 0,
    "withoutCompany" INTEGER NOT NULL DEFAULT 0,
    "withoutPrice" INTEGER NOT NULL DEFAULT 0,
    "duplicates" INTEGER NOT NULL DEFAULT 0,
    "divergences" INTEGER NOT NULL DEFAULT 0,
    "importedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductionImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductionImportRow" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "companyName" TEXT,
    "companyCnpj" TEXT,
    "patientName" TEXT,
    "patientCpf" TEXT,
    "serviceDate" TIMESTAMP(3),
    "examType" TEXT,
    "complementaryExams" TEXT,
    "protocol" TEXT,
    "importedValue" DOUBLE PRECISION,
    "matchedPrice" DOUBLE PRECISION,
    "status" "ProductionImportRowStatus" NOT NULL DEFAULT 'PENDENTE',
    "companyId" TEXT,
    "priceListItemId" TEXT,
    "closingId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionImportRow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ClosingLineItem" (
    "id" TEXT NOT NULL,
    "closingId" TEXT NOT NULL,
    "companyId" TEXT,
    "serviceName" TEXT NOT NULL,
    "patientName" TEXT,
    "patientCpf" TEXT,
    "serviceDate" TIMESTAMP(3),
    "examType" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClosingLineItem_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "PriceListItem_clinicId_companyId_idx" ON "PriceListItem"("clinicId", "companyId");
CREATE INDEX IF NOT EXISTS "PriceListItem_name_idx" ON "PriceListItem"("name");
CREATE INDEX IF NOT EXISTS "ProductionImportRow_importId_status_idx" ON "ProductionImportRow"("importId", "status");

-- ForeignKeys
ALTER TABLE "MonthlyClosing" ADD CONSTRAINT "MonthlyClosing_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ProductionImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceListHistory" ADD CONSTRAINT "PriceListHistory_priceListItemId_fkey" FOREIGN KEY ("priceListItemId") REFERENCES "PriceListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceListHistory" ADD CONSTRAINT "PriceListHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductionImport" ADD CONSTRAINT "ProductionImport_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductionImport" ADD CONSTRAINT "ProductionImport_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionImportRow" ADD CONSTRAINT "ProductionImportRow_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ProductionImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionImportRow" ADD CONSTRAINT "ProductionImportRow_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductionImportRow" ADD CONSTRAINT "ProductionImportRow_priceListItemId_fkey" FOREIGN KEY ("priceListItemId") REFERENCES "PriceListItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductionImportRow" ADD CONSTRAINT "ProductionImportRow_closingId_fkey" FOREIGN KEY ("closingId") REFERENCES "MonthlyClosing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClosingLineItem" ADD CONSTRAINT "ClosingLineItem_closingId_fkey" FOREIGN KEY ("closingId") REFERENCES "MonthlyClosing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClosingLineItem" ADD CONSTRAINT "ClosingLineItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
