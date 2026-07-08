"use client";

import { useEffect, useState } from "react";
import {
  updatePreReferralStatusWithNotes,
  addPreReferralInternalNote,
  convertPreReferralWithOptions,
  getConvertPreReferralOptions,
  checkPreReferralDuplicates,
} from "@/actions/pre-referrals";
import { PRE_REFERRAL_STATUS_LABELS } from "@/types";
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
import type { ClinicalExamType } from "@prisma/client";

export function PreReferralStatusDialog({
  open,
  onOpenChange,
  preReferralId,
  currentStatus,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preReferralId: string;
  currentStatus: string;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(currentStatus);
      setNotes("");
    }
  }, [open, currentStatus]);

  const handleSave = async () => {
    setLoading(true);
    const result = await updatePreReferralStatusWithNotes(preReferralId, status, notes);
    setLoading(false);
    if (result.success) {
      toast.success("Status atualizado!");
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
          <DialogTitle>Alterar status</DialogTitle>
          <DialogDescription>A alteração será registrada no histórico.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Novo status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="referral-select w-full"
            >
              {Object.entries(PRE_REFERRAL_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PreReferralNoteDialog({
  open,
  onOpenChange,
  preReferralId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preReferralId: string;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const result = await addPreReferralInternalNote(preReferralId, note);
    setLoading(false);
    if (result.success) {
      toast.success("Observação registrada!");
      setNote("");
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
          <DialogTitle>Observação interna</DialogTitle>
          <DialogDescription>Visível apenas para a equipe interna.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex.: Cliente pediu retorno após as 14h."
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="brand" onClick={handleSave} disabled={loading || !note.trim()}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PreReferralConvertDialog({
  open,
  onOpenChange,
  preReferralId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preReferralId: string;
  onSuccess: (referralId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [clinicalExamType, setClinicalExamType] = useState<ClinicalExamType>("ADMISSIONAL");
  const [notes, setNotes] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [createCompany, setCreateCompany] = useState(true);
  const [createPatient, setCreatePatient] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [companies, setCompanies] = useState<{ id: string; legalName: string; tradeName: string | null }[]>([]);
  const [patients, setPatients] = useState<{ id: string; fullName: string; jobTitle: string | null }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    Promise.all([
      getConvertPreReferralOptions(preReferralId),
      checkPreReferralDuplicates(preReferralId),
    ]).then(([opts, dups]) => {
      setLoadingOptions(false);
      if (opts.success) {
        setCompanies(opts.companies);
        setPatients(opts.patients);
        setUsers(opts.users);
        setCompanyId(opts.suggestedCompanyId ?? "");
        setClinicalExamType(
          opts.pre.clinicalExamType === "NAO_SEI_INFORMAR"
            ? "ADMISSIONAL"
            : (opts.pre.clinicalExamType as ClinicalExamType)
        );
        setNotes(opts.pre.notes ?? "");
        setCreateCompany(!opts.suggestedCompanyId);
      }
      if (dups.success && dups.hasDuplicates) {
        const parts: string[] = [];
        if (dups.similarCompanies.length) parts.push("empresa similar");
        if (dups.similarPatients.length) parts.push("colaborador com mesmo CPF");
        if (dups.recentReferrals.length) parts.push("encaminhamento recente similar");
        setDuplicateWarning(
          `Encontramos registros semelhantes (${parts.join(", ")}). Deseja vincular a um cadastro existente?`
        );
      } else {
        setDuplicateWarning(null);
      }
    });
  }, [open, preReferralId]);

  const handleConvert = async () => {
    if (!confirm("Confirmar conversão em encaminhamento oficial?")) return;
    setLoading(true);
    const result = await convertPreReferralWithOptions(preReferralId, {
      companyId: companyId || undefined,
      createCompany,
      patientId: patientId || undefined,
      createPatient,
      clinicalExamType,
      notes,
      assignedToId: assignedToId || undefined,
    });
    setLoading(false);
    if (result.success) {
      toast.success(`Encaminhamento ${result.protocol} criado!`);
      onOpenChange(false);
      onSuccess(result.referralId);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Converter em encaminhamento oficial</DialogTitle>
          <DialogDescription>
            Revise os dados antes de gerar o protocolo oficial.
          </DialogDescription>
        </DialogHeader>

        {loadingOptions ? (
          <p className="py-8 text-center text-sm text-slate-500">Carregando opções...</p>
        ) : (
          <div className="space-y-4 py-2">
            {duplicateWarning && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {duplicateWarning}
              </div>
            )}

            <div className="space-y-2">
              <Label>Empresa</Label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setCreateCompany(!e.target.value);
                }}
                className="referral-select w-full"
              >
                <option value="">Cadastrar nova com dados do pré-encaminhamento</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tradeName ?? c.legalName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Colaborador</Label>
              <select
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value);
                  setCreatePatient(!e.target.value);
                }}
                className="referral-select w-full"
                disabled={!companyId && createCompany}
              >
                <option value="">Cadastrar novo com dados do pré-encaminhamento</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}{p.jobTitle ? ` — ${p.jobTitle}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de exame</Label>
              <select
                value={clinicalExamType}
                onChange={(e) => setClinicalExamType(e.target.value as ClinicalExamType)}
                className="referral-select w-full"
              >
                {Object.entries(CLINICAL_EXAM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Responsável interno</Label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="referral-select w-full"
              >
                <option value="">Eu (usuário atual)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Observações do encaminhamento</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="brand" onClick={handleConvert} disabled={loading || loadingOptions}>
            {loading ? "Convertendo..." : "Confirmar conversão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
