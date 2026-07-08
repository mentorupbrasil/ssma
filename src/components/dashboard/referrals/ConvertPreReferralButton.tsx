"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightCircle } from "lucide-react";
import { convertPreReferralToReferral } from "@/actions/referrals";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

export function ConvertPreReferralButton({
  preReferralId,
  disabled,
}: {
  preReferralId: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { confirm, ConfirmDialogHost } = useConfirmDialog();

  const handleConvert = async () => {
    const ok = await confirm({
      title: "Converter pré-encaminhamento",
      description: "Converter este pré-encaminhamento em encaminhamento oficial?",
      confirmLabel: "Converter",
    });
    if (!ok) return;
    setLoading(true);
    const result = await convertPreReferralToReferral(preReferralId);
    setLoading(false);
    if (result.success) {
      toast.success(`Encaminhamento ${result.protocol} criado!`);
      router.push(`/dashboard/encaminhamentos?id=${result.referralId}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <Button
        variant="brand"
        size="sm"
        onClick={handleConvert}
        disabled={disabled || loading}
      >
        <ArrowRightCircle className="mr-2 h-4 w-4" />
        {loading ? "Convertendo..." : "Converter em encaminhamento"}
      </Button>
      <ConfirmDialogHost />
    </>
  );
}
