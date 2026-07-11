import {
  REFERRAL_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  APPOINTMENT_STATUS_LABELS,
  DOCUMENT_STATUS_LABELS,
  PRE_REFERRAL_STATUS_LABELS,
  CONTACT_MESSAGE_STATUS_LABELS,
  COMPANY_STATUS_LABELS,
  PATIENT_STATUS_LABELS,
  EXAM_STATUS_LABELS,
} from "@/types";
import { getStatusTone } from "@/lib/status-tones";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  type?:
    | "referral"
    | "lead"
    | "quote"
    | "appointment"
    | "document"
    | "preReferral"
    | "contact"
    | "company"
    | "collaborator"
    | "exam";
  label?: string;
  className?: string;
};

const LABEL_MAPS = {
  referral: REFERRAL_STATUS_LABELS,
  lead: LEAD_STATUS_LABELS,
  quote: QUOTE_STATUS_LABELS,
  appointment: APPOINTMENT_STATUS_LABELS,
  document: DOCUMENT_STATUS_LABELS,
  preReferral: PRE_REFERRAL_STATUS_LABELS,
  contact: CONTACT_MESSAGE_STATUS_LABELS,
  company: COMPANY_STATUS_LABELS,
  collaborator: PATIENT_STATUS_LABELS,
  exam: EXAM_STATUS_LABELS,
};

export function StatusBadge({ status, type = "referral", label, className }: StatusBadgeProps) {
  const labels = LABEL_MAPS[type];
  const displayLabel = label ?? labels[status as keyof typeof labels] ?? status;
  const tone = getStatusTone(status);

  return (
    <span
      data-tone={tone}
      className={cn("status-badge-premium", className)}
    >
      <span className="status-badge-premium-dot" aria-hidden />
      {displayLabel}
    </span>
  );
}
