"use client";

import { useState, useTransition } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  RefreshCw,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { updateReferralStatusWithNotes } from "@/actions/referrals";
import type { ReferralStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

type StatusOption = {
  value: ReferralStatus;
  label: string;
  hint: string;
  icon: typeof CalendarCheck2;
  iconClass: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "AGENDADO",
    label: "Agendado",
    hint: "Clínica confirmou e vai atender",
    icon: CalendarCheck2,
    iconClass: "collaborator-action-icon--schedule",
  },
  {
    value: "EM_ATENDIMENTO",
    label: "Em atendimento",
    hint: "Exame em andamento",
    icon: Stethoscope,
    iconClass: "collaborator-action-icon--progress",
  },
  {
    value: "CONCLUIDO",
    label: "Concluído",
    hint: "Atendimento finalizado",
    icon: CheckCircle2,
    iconClass: "collaborator-action-icon--done",
  },
  {
    value: "CANCELADO",
    label: "Cancelado",
    hint: "Informar motivo à empresa",
    icon: XCircle,
    iconClass: "collaborator-action-icon--cancel",
  },
];

type ReferralStatusMenuProps = {
  referralId: string;
  currentStatus: string;
  onCancelRequest: () => void;
  onSuccess: () => void;
};

export function ReferralStatusMenu({
  referralId,
  currentStatus,
  onCancelRequest,
  onSuccess,
}: ReferralStatusMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const applyStatus = (status: ReferralStatus) => {
    if (status === currentStatus) {
      setOpen(false);
      return;
    }
    if (status === "CANCELADO") {
      setOpen(false);
      onCancelRequest();
      return;
    }

    startTransition(async () => {
      const result = await updateReferralStatusWithNotes(referralId, status);
      if (result.success) {
        toast.success("Status atualizado!");
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-md"
            disabled={isPending}
            onClick={(e) => e.stopPropagation()}
            aria-label="Alterar status"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            Status
          </Button>
        }
      />
      <PopoverContent
        className="collaborator-action-menu w-64 p-1.5"
        align="end"
        sideOffset={6}
        onClick={(e) => e.stopPropagation()}
      >
        {STATUS_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isCurrent = option.value === currentStatus;
          return (
            <button
              key={option.value}
              type="button"
              className="collaborator-action-item"
              disabled={isPending || isCurrent}
              onClick={() => applyStatus(option.value)}
            >
              <span className={`collaborator-action-icon ${option.iconClass}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="collaborator-action-label">{option.label}</span>
                <span className="collaborator-action-hint">
                  {isCurrent ? "Status atual" : option.hint}
                </span>
              </span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
