"use client";

import { useEffect, useState } from "react";
import {
  createAppointmentFull,
  rescheduleAppointment,
  cancelAppointment,
  markAppointmentNoShow,
  addAppointmentNote,
  getAppointmentFormOptions,
} from "@/actions/appointments";
import { CLINICAL_EXAM_LABELS } from "@/types";
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
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

type FormOptions = Awaited<ReturnType<typeof getAppointmentFormOptions>>;

type NewAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (id?: string) => void;
  prefill?: {
    patientId?: string;
    companyId?: string;
    referralId?: string;
    protocol?: string;
    clinicalExamType?: string;
    examIds?: string[];
    notes?: string;
  };
};

export function NewAppointmentDialog({
  open,
  onOpenChange,
  onSuccess,
  prefill,
}: NewAppointmentDialogProps) {
  const { confirm, ConfirmDialogHost } = useConfirmDialog();
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [referralId, setReferralId] = useState("");
  const [clinicalExamType, setClinicalExamType] = useState("");
  const [examIds, setExamIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [notes, setNotes] = useState("");
  const [forceConflict, setForceConflict] = useState(false);

  useEffect(() => {
    if (open) {
      getAppointmentFormOptions().then(setOptions);
      setPatientId(prefill?.patientId ?? "");
      setCompanyId(prefill?.companyId ?? "");
      setReferralId(prefill?.referralId ?? "");
      setClinicalExamType(prefill?.clinicalExamType ?? "");
      setExamIds(prefill?.examIds ?? []);
      setNotes(prefill?.notes ?? "");
      setScheduledAt("");
      setProfessionalId("");
      setRoomName("");
      setForceConflict(false);
    }
  }, [open, prefill]);

  const handleReferralChange = (id: string) => {
    setReferralId(id);
    if (!options || !options.success) return;
    const ref = options.referrals.find((r) => r.id === id);
    if (ref) {
      setPatientId(ref.patientId);
      setCompanyId(ref.companyId);
      setClinicalExamType(ref.clinicalExamType);
      setExamIds(ref.exams.map((e) => e.examId).filter((id): id is string => !!id));
      if (ref.internalNotes) setNotes(ref.internalNotes);
    }
  };

  const handleSave = async () => {
    if (!scheduledAt || !patientId) {
      toast.error("Informe colaborador e data/horário.");
      return;
    }
    setLoading(true);
    const result = await createAppointmentFull(
      {
        patientId,
        companyId: companyId || undefined,
        referralId: referralId || undefined,
        protocol: prefill?.protocol,
        clinicalExamType: clinicalExamType || undefined,
        scheduledAt,
        professionalId: professionalId || undefined,
        roomName: roomName || undefined,
        notes,
        examIds: examIds.length ? examIds : undefined,
      },
      { forceConflict }
    );
    setLoading(false);

    if (result.success) {
      toast.success("Agendamento criado!");
      onOpenChange(false);
      onSuccess(result.id);
    } else if (result.error?.startsWith("CONFLICT:")) {
      const ok = await confirm({
        title: "Conflito de horário",
        description: result.error.replace("CONFLICT:", ""),
        confirmLabel: "Agendar mesmo assim",
      });
      if (ok) {
        setForceConflict(true);
        setLoading(true);
        const retry = await createAppointmentFull(
          {
            patientId,
            companyId: companyId || undefined,
            referralId: referralId || undefined,
            clinicalExamType: clinicalExamType || undefined,
            scheduledAt,
            professionalId: professionalId || undefined,
            roomName: roomName || undefined,
            notes,
            examIds: examIds.length ? examIds : undefined,
          },
          { forceConflict: true }
        );
        setLoading(false);
        if (retry.success) {
          toast.success("Agendamento criado!");
          onOpenChange(false);
          onSuccess(retry.id);
        } else {
          toast.error(retry.error);
        }
      }
    } else {
      toast.error(result.error);
    }
  };

  const patients = options?.success ? options.patients : [];
  const companies = options?.success ? options.companies : [];
  const referrals = options?.success ? options.referrals : [];
  const exams = options?.success ? options.exams : [];
  const professionals = options?.success ? options.professionals : [];
  const rooms = options?.success ? options.rooms : [];

  const filteredReferrals = referrals.filter(
    (r) => !patientId || r.patientId === patientId
  );

  const toggleExam = (id: string) => {
    setExamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>
            Crie um atendimento vinculado ou avulso. O histórico será registrado automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {companies.length > 0 && (
            <div className="space-y-2">
              <Label>Empresa</Label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecione</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tradeName ?? c.legalName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Colaborador *</Label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          {filteredReferrals.length > 0 && (
            <div className="space-y-2">
              <Label>Encaminhamento (opcional)</Label>
              <select
                value={referralId}
                onChange={(e) => handleReferralChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Agendamento avulso</option>
                {filteredReferrals.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.protocol}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tipo de exame</Label>
            <select
              value={clinicalExamType}
              onChange={(e) => setClinicalExamType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione</option>
              {Object.entries(CLINICAL_EXAM_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
              <option value="OUTRO">Outro</option>
            </select>
          </div>

          {exams.length > 0 && (
            <div className="space-y-2">
              <Label>Exames complementares</Label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
                {exams.map((e) => (
                  <label key={e.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={examIds.includes(e.id)}
                      onChange={() => toggleExam(e.id)}
                    />
                    {e.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Data e horário *</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          {professionals.length > 0 && (
            <div className="space-y-2">
              <Label>Profissional</Label>
              <select
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Não definido</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {rooms.length > 0 && (
            <div className="space-y-2">
              <Label>Sala/unidade</Label>
              <select
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Não definida</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Criar agendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialogHost />
  </>
  );
}

type RescheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  onSuccess: () => void;
};

export function RescheduleAppointmentDialog({
  open,
  onOpenChange,
  appointmentId,
  onSuccess,
}: RescheduleDialogProps) {
  const { confirm, ConfirmDialogHost } = useConfirmDialog();
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setScheduledAt("");
      setNotes("");
    }
  }, [open]);

  const handleSave = async (force = false) => {
    if (!scheduledAt || notes.trim().length < 3) {
      toast.error("Informe nova data/horário e motivo.");
      return;
    }
    setLoading(true);
    const result = await rescheduleAppointment(
      appointmentId,
      { scheduledAt, notes },
      { forceConflict: force }
    );
    setLoading(false);
    if (result.success) {
      toast.success("Reagendado com sucesso!");
      onOpenChange(false);
      onSuccess();
    } else if (result.error?.startsWith("CONFLICT:")) {
      const ok = await confirm({
        title: "Conflito de horário",
        description: result.error.replace("CONFLICT:", ""),
        confirmLabel: "Reagendar mesmo assim",
      });
      if (ok) {
        handleSave(true);
      }
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reagendar</DialogTitle>
          <DialogDescription>
            O agendamento anterior será marcado como reagendado e um novo será criado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nova data e horário *</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Motivo *</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informe o motivo do reagendamento"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={() => handleSave()} disabled={loading}>
            {loading ? "Salvando..." : "Confirmar reagendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialogHost />
  </>
  );
}

type ReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (notes: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
};

export function AppointmentReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  onSuccess,
}: ReasonDialogProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setNotes("");
  }, [open]);

  const handleSave = async () => {
    if (notes.trim().length < 3) {
      toast.error("Informe uma observação.");
      return;
    }
    setLoading(true);
    const result = await onConfirm(notes.trim());
    setLoading(false);
    if (result.success) {
      toast.success("Registrado!");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Observação *</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Descreva o motivo"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type NoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  onSuccess: () => void;
};

export function AddAppointmentNoteDialog({
  open,
  onOpenChange,
  appointmentId,
  onSuccess,
}: NoteDialogProps) {
  const [note, setNote] = useState("");
  const [type, setType] = useState<"internal" | "attendance">("internal");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNote("");
      setType("internal");
    }
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    const result = await addAppointmentNote(appointmentId, { note, type });
    setLoading(false);
    if (result.success) {
      toast.success("Observação adicionada!");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova observação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "internal" | "attendance")}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="internal">Interna</option>
              <option value="attendance">Para atendimento</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
