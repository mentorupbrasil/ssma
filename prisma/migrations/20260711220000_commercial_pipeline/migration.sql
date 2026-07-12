-- CreateEnum
CREATE TYPE "CommercialStage" AS ENUM (
  'NOVO_LEAD',
  'CONTATO_REALIZADO',
  'QUALIFICACAO',
  'PROPOSTA_ENVIADA',
  'EM_NEGOCIACAO',
  'AGUARDANDO_RETORNO',
  'GANHO',
  'PERDIDO'
);

-- CreateEnum
CREATE TYPE "CommercialFollowUpStatus" AS ENUM ('PENDENTE', 'REALIZADO', 'CANCELADO');

-- AlterTable Lead
ALTER TABLE "Lead" ADD COLUMN "stage" "CommercialStage" NOT NULL DEFAULT 'NOVO_LEAD';
ALTER TABLE "Lead" ADD COLUMN "city" TEXT;
ALTER TABLE "Lead" ADD COLUMN "cnpj" TEXT;
ALTER TABLE "Lead" ADD COLUMN "estimatedEmployees" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "nextFollowUpAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "followUpAction" TEXT;
ALTER TABLE "Lead" ADD COLUMN "lastContactAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "lostReason" TEXT;

-- Backfill stage from legacy status
UPDATE "Lead" SET "stage" = CASE "status"::text
  WHEN 'NOVO' THEN 'NOVO_LEAD'::"CommercialStage"
  WHEN 'EM_CONTATO' THEN 'CONTATO_REALIZADO'::"CommercialStage"
  WHEN 'EM_ANALISE' THEN 'QUALIFICACAO'::"CommercialStage"
  WHEN 'CONVERTIDO_ORCAMENTO' THEN 'PROPOSTA_ENVIADA'::"CommercialStage"
  WHEN 'PROPOSTA_ENVIADA' THEN 'PROPOSTA_ENVIADA'::"CommercialStage"
  WHEN 'AGUARDANDO_RETORNO' THEN 'AGUARDANDO_RETORNO'::"CommercialStage"
  WHEN 'FECHADO' THEN 'GANHO'::"CommercialStage"
  WHEN 'PERDIDO' THEN 'PERDIDO'::"CommercialStage"
  WHEN 'EXPIRADO' THEN 'PERDIDO'::"CommercialStage"
  WHEN 'ARQUIVADO' THEN 'PERDIDO'::"CommercialStage"
  ELSE 'NOVO_LEAD'::"CommercialStage"
END;

-- CreateTable
CREATE TABLE "CommercialFollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "action" TEXT NOT NULL,
    "status" "CommercialFollowUpStatus" NOT NULL DEFAULT 'PENDENTE',
    "result" TEXT,
    "notes" TEXT,
    "assignedToUserId" TEXT,
    "createdByUserId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommercialFollowUp_dueAt_status_idx" ON "CommercialFollowUp"("dueAt", "status");
CREATE INDEX "CommercialFollowUp_leadId_idx" ON "CommercialFollowUp"("leadId");

-- AddForeignKey
ALTER TABLE "CommercialFollowUp" ADD CONSTRAINT "CommercialFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialFollowUp" ADD CONSTRAINT "CommercialFollowUp_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommercialFollowUp" ADD CONSTRAINT "CommercialFollowUp_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
