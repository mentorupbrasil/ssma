"use client";

import { useEffect, useState } from "react";
import { createCollaboratorFull, updateCollaborator } from "@/actions/collaborators";
import { PATIENT_STATUS_LABELS } from "@/lib/collaborators";
import type { PatientStatus } from "@prisma/client";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type NewCollaboratorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
  onSuccess: (id: string, createReferral: boolean) => void;
};

export function NewCollaboratorDialog({
  open,
  onOpenChange,
  companies,
  defaultCompanyId,
  onSuccess,
}: NewCollaboratorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    cpf: "",
    birthDate: "",
    phone: "",
    email: "",
    companyId: defaultCompanyId ?? "",
    jobTitle: "",
    department: "",
    admissionDate: "",
    nextPeriodicDate: "",
    notes: "",
    status: "ATIVO",
  });

  useEffect(() => {
    if (open) {
      setForm((f) => ({
        ...f,
        companyId: defaultCompanyId ?? f.companyId,
        fullName: "",
        cpf: "",
        birthDate: "",
        phone: "",
        email: "",
        jobTitle: "",
        department: "",
        admissionDate: "",
        nextPeriodicDate: "",
        notes: "",
      }));
    }
  }, [open, defaultCompanyId]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (createReferral: boolean) => {
    setLoading(true);
    const result = await createCollaboratorFull(form);
    setLoading(false);
    if (result.success) {
      toast.success("Colaborador cadastrado!");
      onOpenChange(false);
      onSuccess(result.id, createReferral);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo colaborador</DialogTitle>
          <DialogDescription>
            Cadastre o colaborador vinculado à empresa para encaminhamentos e exames ocupacionais.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome completo *</Label>
            <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>CPF *</Label>
              <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <Input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Empresa *</Label>
            <select
              value={form.companyId}
              onChange={(e) => set("companyId", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Função *</Label>
              <Input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Input value={form.department} onChange={(e) => set("department", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data de admissão</Label>
              <Input type="date" value={form.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Próximo periódico</Label>
              <Input type="date" value={form.nextPeriodicDate} onChange={(e) => set("nextPeriodicDate", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações internas</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={() => save(false)} disabled={loading}>
            Salvar colaborador
          </Button>
          <Button variant="brand" onClick={() => save(true)} disabled={loading}>
            {loading ? "Salvando..." : "Salvar e criar encaminhamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

type EditCollaboratorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboratorId: string;
  collaborator: {
    fullName: string;
    cpf: string;
    birthDate: string | null;
    phone: string | null;
    email: string | null;
    companyId: string | null;
    jobTitle: string | null;
    department: string | null;
    admissionDate: string | null;
    nextPeriodicDate: string | null;
    status: PatientStatus;
    notes: string | null;
  };
  onSuccess: () => void;
};

export function EditCollaboratorDialog({
  open,
  onOpenChange,
  collaboratorId,
  collaborator,
  onSuccess,
}: EditCollaboratorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: collaborator.fullName,
    cpf: collaborator.cpf,
    birthDate: toDateInput(collaborator.birthDate),
    phone: collaborator.phone ?? "",
    email: collaborator.email ?? "",
    companyId: collaborator.companyId ?? "",
    jobTitle: collaborator.jobTitle ?? "",
    department: collaborator.department ?? "",
    admissionDate: toDateInput(collaborator.admissionDate),
    nextPeriodicDate: toDateInput(collaborator.nextPeriodicDate),
    status: collaborator.status,
    notes: collaborator.notes ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        fullName: collaborator.fullName,
        cpf: collaborator.cpf,
        birthDate: toDateInput(collaborator.birthDate),
        phone: collaborator.phone ?? "",
        email: collaborator.email ?? "",
        companyId: collaborator.companyId ?? "",
        jobTitle: collaborator.jobTitle ?? "",
        department: collaborator.department ?? "",
        admissionDate: toDateInput(collaborator.admissionDate),
        nextPeriodicDate: toDateInput(collaborator.nextPeriodicDate),
        status: collaborator.status,
        notes: collaborator.notes ?? "",
      });
    }
  }, [open, collaborator]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setLoading(true);
    const result = await updateCollaborator(collaboratorId, form);
    setLoading(false);
    if (result.success) {
      toast.success("Colaborador atualizado!");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar colaborador</DialogTitle>
          <DialogDescription>Atualize os dados cadastrais e ocupacionais.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome completo *</Label>
            <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>CPF *</Label>
              <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <Input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Função *</Label>
              <Input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Input value={form.department} onChange={(e) => set("department", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data de admissão</Label>
              <Input type="date" value={form.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Próximo periódico</Label>
              <Input type="date" value={form.nextPeriodicDate} onChange={(e) => set("nextPeriodicDate", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {(Object.keys(PATIENT_STATUS_LABELS) as PatientStatus[]).map((s) => (
                <option key={s} value={s}>
                  {PATIENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Observações internas</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
