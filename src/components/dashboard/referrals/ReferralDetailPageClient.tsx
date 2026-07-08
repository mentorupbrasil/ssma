"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReferralDetailSerialized } from "@/lib/referrals";
import { ReferralDetailContent } from "./ReferralDetailContent";
import {
  ReferralStatusDialog,
  ReferralScheduleDialog,
  ReferralDocumentDialog,
} from "./ReferralActionDialogs";

export function ReferralDetailPageClient({
  referral: initialReferral,
  canManage,
}: {
  referral: ReferralDetailSerialized;
  canManage: boolean;
}) {
  const router = useRouter();
  const [referral, setReferral] = useState(initialReferral);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);

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
        onOpenSchedule={() => setScheduleDialogOpen(true)}
        onOpenDocument={() => setDocumentDialogOpen(true)}
      />

      <ReferralStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        referralId={referral.id}
        currentStatus={referral.status}
        onSuccess={refresh}
      />
      <ReferralScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        referralId={referral.id}
        onSuccess={refresh}
      />
      <ReferralDocumentDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        referralId={referral.id}
        onSuccess={refresh}
      />
    </>
  );
}
