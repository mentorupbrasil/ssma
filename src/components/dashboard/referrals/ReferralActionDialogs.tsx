"use client";

import { useEffect, useState } from "react";
import { updateReferralStatusWithNotes, scheduleReferralAppointment, attachReferralDocument } from "@/actions/referrals";
import { REFERRAL_STATUS_LABELS } from "@/types";
import {
  REFERRAL_DOCUMENT_TYPE_LABELS,
  CLINIC_OPERATIONAL_STATUSES,
  CLINIC_STATUS_CHANGE_OPTIONS,
} from "@/lib/referrals";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type StatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
  currentStatus: string;
  onSuccess: () => void;
};

export function ReferralStatusDialog({
  open,
  onOpenChange,
  referralId,
  currentStatus,
  onSuccess,
  clinicMode = false,
  cancelOnly = false,
}: StatusDialogProps & { clinicMode?: boolean; cancelOnly?: boolean }) {
  const [status, setStatus] = useState(cancelOnly ? "CANCELADO" : currentStatus);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (cancelOnly) {
        setStatus("CANCELADO");
      } else {
        const initial = clinicMode
          ? CLINIC_OPERATIONAL_STATUSES.includes(currentStatus as (typeof CLINIC_OPERATIONAL_STATUSES)[number])
            ? currentStatus
            : "AGENDADO"
          : currentStatus;
        setStatus(initial);
      }
      setNotes("");
    }
  }, [open, currentStatus, clinicMode, cancelOnly]);

  const handleSave = async () => {
    if (status === currentStatus && !cancelOnly) {
      onOpenChange(false);
      return;
    }
    if (status === "CANCELADO" && !notes.trim()) {
      toast.error("Informe o motivo do cancelamento para a empresa.");
      return;
    }
    setLoading(true);
    const result = await updateReferralStatusWithNotes(referralId, status, notes);
    setLoading(false);
    if (result.success) {
      toast.success(cancelOnly ? "Atendimento cancelado." : "Status atualizado!");
      onOpenChange(false);
      setNotes("");
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  const statusOptions = clinicMode
    ? CLINIC_STATUS_CHANGE_OPTIONS
    : Object.entries(REFERRAL_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cancelOnly ? "Cancelar atendimento" : "Alterar status"}</DialogTitle>
          <DialogDescription>
            {cancelOnly
              ? "O motivo será visível para a empresa no portal."
              : clinicMode
                ? "A empresa acompanha esta mudança no portal. No cancelamento, o motivo é obrigatório."
                : "A alteração será registrada no histórico do encaminhamento."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!cancelOnly && (
            <div className="space-y-2">
              <Label htmlFor="status">Novo status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {status === "CANCELADO" || cancelOnly
                ? "Motivo do cancelamento"
                : "Observação (opcional)"}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                status === "CANCELADO" || cancelOnly
                  ? "Explique o motivo para a empresa visualizar"
                  : "Motivo ou detalhes da alteração"
              }
              rows={3}
              required={status === "CANCELADO" || cancelOnly}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : cancelOnly ? "Confirmar cancelamento" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
  onSuccess: () => void;
};

export function ReferralScheduleDialog({
  open,
  onOpenChange,
  referralId,
  onSuccess,
}: ScheduleDialogProps) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!scheduledAt) {
      toast.error("Informe data e horário.");
      return;
    }
    setLoading(true);
    const result = await scheduleReferralAppointment(referralId, { scheduledAt, notes });
    setLoading(false);
    if (result.success) {
      toast.success("Atendimento agendado!");
      onOpenChange(false);
      setScheduledAt("");
      setNotes("");
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar atendimento</DialogTitle>
          <DialogDescription>
            O status do encaminhamento será atualizado para Agendado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Data e horário</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduleNotes">Observações</Label>
            <Textarea
              id="scheduleNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Unidade, profissional ou orientações"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Agendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
  onSuccess: () => void;
};

export function ReferralDocumentDialog({
  open,
  onOpenChange,
  referralId,
  onSuccess,
}: DocumentDialogProps) {
  const [type, setType] = useState("ASO");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fileName.trim() || !fileUrl.trim()) {
      toast.error("Informe nome e URL do documento.");
      return;
    }
    setLoading(true);
    const result = await attachReferralDocument(referralId, {
      type,
      fileName: fileName.trim(),
      fileUrl: fileUrl.trim(),
    });
    setLoading(false);
    if (result.success) {
      toast.success("Documento anexado!");
      onOpenChange(false);
      setFileName("");
      setFileUrl("");
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anexar documento</DialogTitle>
          <DialogDescription>
            Informe o tipo e o link do arquivo (URL pública ou storage).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="docType">Tipo</Label>
            <select
              id="docType"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(REFERRAL_DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fileName">Nome do arquivo</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="aso-colaborador.pdf"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fileUrl">URL do documento</Label>
            <Input
              id="fileUrl"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Anexar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
