"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updatePreReferralStatus } from "@/actions";
import type { PreReferralStatus } from "@prisma/client";
import { PRE_REFERRAL_STATUS_LABELS } from "@/types";

type PreReferralStatusFormProps = {
  requestId: string;
  currentStatus: PreReferralStatus;
};

export function PreReferralStatusForm({ requestId, currentStatus }: PreReferralStatusFormProps) {
  const [pending, startTransition] = useTransition();

  const handleChange = (status: PreReferralStatus) => {
    startTransition(async () => {
      const result = await updatePreReferralStatus(requestId, status);
      if (result.success) {
        toast.success("Status atualizado");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <select
      value={currentStatus}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value as PreReferralStatus)}
      className="form-select text-sm"
    >
      {Object.entries(PRE_REFERRAL_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
