-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');
CREATE TYPE "TaskPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');
CREATE TYPE "TicketStatus" AS ENUM ('ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'FECHADO');
CREATE TYPE "TicketPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
CREATE TYPE "TicketScope" AS ENUM ('CLINIC', 'SAAS');
CREATE TYPE "FinancialEntryType" AS ENUM ('RECEBER', 'PAGAR');
CREATE TYPE "FinancialEntryStatus" AS ENUM ('PENDENTE', 'PARCIAL', 'PAGO', 'ATRASADO', 'CANCELADO');
CREATE TYPE "MonthlyClosingStatus" AS ENUM ('RASCUNHO', 'EM_REVISAO', 'FECHADO', 'FATURADO');

-- AlterTable Setting
ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "Setting" DROP CONSTRAINT IF EXISTS "Setting_key_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_clinicId_key_key" ON "Setting"("clinicId", "key");

-- AlterTable BlogPost
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;

-- CreateTable Task
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDENTE',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIA',
    "dueDate" TIMESTAMP(3),
    "assignedToUserId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable Ticket
CREATE TABLE IF NOT EXISTS "Ticket" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "scope" "TicketScope" NOT NULL DEFAULT 'CLINIC',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'ABERTO',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIA',
    "createdByUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable MonthlyClosing
CREATE TABLE IF NOT EXISTS "MonthlyClosing" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "referenceMonth" TIMESTAMP(3) NOT NULL,
    "status" "MonthlyClosingStatus" NOT NULL DEFAULT 'RASCUNHO',
    "totalAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "companyId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MonthlyClosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable FinancialEntry
CREATE TABLE IF NOT EXISTS "FinancialEntry" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "type" "FinancialEntryType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "FinancialEntryStatus" NOT NULL DEFAULT 'PENDENTE',
    "category" TEXT,
    "companyId" TEXT,
    "closingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinancialEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKeys
ALTER TABLE "Task" ADD CONSTRAINT "Task_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MonthlyClosing" ADD CONSTRAINT "MonthlyClosing_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MonthlyClosing" ADD CONSTRAINT "MonthlyClosing_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MonthlyClosing" ADD CONSTRAINT "MonthlyClosing_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_closingId_fkey" FOREIGN KEY ("closingId") REFERENCES "MonthlyClosing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
