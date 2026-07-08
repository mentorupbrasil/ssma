"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateContactMessageStatus } from "@/actions";
import type { ContactMessageStatus } from "@prisma/client";
import { CONTACT_MESSAGE_STATUS_LABELS } from "@/types";

type ContactMessageStatusFormProps = {
  messageId: string;
  currentStatus: ContactMessageStatus;
};

export function ContactMessageStatusForm({
  messageId,
  currentStatus,
}: ContactMessageStatusFormProps) {
  const [pending, startTransition] = useTransition();

  const handleChange = (status: ContactMessageStatus) => {
    startTransition(async () => {
      const result = await updateContactMessageStatus(messageId, status);
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
      onChange={(e) => handleChange(e.target.value as ContactMessageStatus)}
      className="form-select text-sm"
    >
      {Object.entries(CONTACT_MESSAGE_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
