-- CreateEnum
CREATE TYPE "PreReferralClinicalExamType" AS ENUM ('ADMISSIONAL', 'DEMISSIONAL', 'PERIODICO', 'RETORNO_TRABALHO', 'MUDANCA_FUNCAO', 'NAO_SEI_INFORMAR');

-- CreateEnum
CREATE TYPE "ExamSelectionMode" AS ENUM ('NAO_SEI', 'SELECIONAR', 'ANEXAR_FUTURO');

-- CreateEnum
CREATE TYPE "PreReferralStatus" AS ENUM ('NOVO', 'EM_ANALISE', 'CONVERTIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "PublicReferralRequest" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicReferralRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicReferralRequest_protocol_key" ON "PublicReferralRequest"("protocol");
