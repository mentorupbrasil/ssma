"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateReferralStatus } from "@/actions";
import { REFERRAL_STATUS_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReferralStatusForm({
  referralId,
  currentStatus,
}: {
  referralId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    const result = await updateReferralStatus(referralId, status);
    setLoading(false);
    if (result.success) {
      toast.success("Status atualizado!");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-4">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="flex h-9 w-full rounded-md border px-3 text-sm"
      >
        {Object.entries(REFERRAL_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <Button onClick={handleSave} disabled={loading} className="w-full bg-[#16A085] hover:bg-[#138d75]">
        {loading ? "Salvando..." : "Salvar status"}
      </Button>
    </div>
  );
}
