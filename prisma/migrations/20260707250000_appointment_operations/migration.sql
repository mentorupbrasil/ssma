-- AppointmentStatus extensions
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'EM_ATENDIMENTO';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CONCLUIDO';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'REAGENDADO';

-- Migrate legacy REALIZADO to CONCLUIDO
UPDATE "Appointment" SET status = 'CONCLUIDO' WHERE status::text = 'REALIZADO';

-- AppointmentHistoryAction enum
DO $$ BEGIN
  CREATE TYPE "AppointmentHistoryAction" AS ENUM (
    'CREATED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'NO_SHOW',
    'ATTENDANCE_STARTED', 'COMPLETED', 'NOTE_ADDED', 'STATUS_CHANGED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Appointment columns
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

-- AppointmentExam
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

-- AppointmentHistory
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
