"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReferralDetailSerialized } from "@/lib/referrals";
import { ReferralDetailContent } from "./ReferralDetailContent";
import { ReferralStatusDialog } from "./ReferralActionDialogs";

export function ReferralDetailPageClient({
  referral: initialReferral,
  canManage,
}: {
  referral: ReferralDetailSerialized;
  canManage: boolean;
}) {
  const router = useRouter();
  const [referral] = useState(initialReferral);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const refresh = () => {
    router.refresh();
  };

  return (
    <>
      <ReferralDetailContent
        referral={referral}
        canManage={canManage}
        onRefresh={refresh}
        onOpenStatus={() => setStatusDialogOpen(true)}
      />

      <ReferralStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        referralId={referral.id}
        currentStatus={referral.status}
        onSuccess={refresh}
        clinicMode
      />
    </>
  );
}
