"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/actions";
import { LEAD_STATUS_LABELS } from "@/types";
import { toast } from "sonner";

export function LeadStatusForm({ leadId, currentStatus }: { leadId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();

  const handleChange = async (newStatus: string) => {
    setStatus(newStatus);
    const result = await updateLeadStatus(leadId, newStatus);
    if (result.success) {
      toast.success("Status atualizado");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      className="h-8 rounded-md border px-2 text-xs"
    >
      {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}
