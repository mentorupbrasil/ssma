"use client";

import { useEffect, useState } from "react";
import { createCollaboratorFull, updateCollaborator } from "@/actions/collaborators";
import { PATIENT_STATUS_LABELS } from "@/lib/collaborators";
import type { PatientStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type CollaboratorFormState = {
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  companyId: string;
  jobTitle: string;
  department: string;
  admissionDate: string;
  nextPeriodicDate: string;
  notes: string;
  status: string;
};

type NewCollaboratorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
  isEmpresaPortal?: boolean;
  onSuccess: (id: string, createReferral: boolean) => void;
};

function CollaboratorFormField({
  label,
  required,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "exam-modal-item exam-modal-item--wide" : "exam-modal-item"}>
      <label className="exam-modal-item-label">
        {label}
        {required ? " *" : ""}
      </label>
      <div className="collaborator-modal-field">{children}</div>
    </div>
  );
}

function CollaboratorModalShell({
  open,
  onOpenChange,
  title,
  description,
  badges,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  badges: { label: string; variant?: "category" | "status" }[];
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="exam-modal collaborator-modal" showCloseButton>
        <header className="exam-modal-head">
          <div className="exam-modal-head-top">
            <div className="exam-drawer-badges">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className={
                    badge.variant === "status"
                      ? "exam-drawer-badge exam-drawer-badge--status"
                      : "exam-drawer-badge exam-drawer-badge--category"
                  }
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
          <DialogTitle className="exam-modal-title">{title}</DialogTitle>
          <DialogDescription className="collaborator-modal-subtitle">
            {description}
          </DialogDescription>
        </header>

        <div className="exam-modal-grid collaborator-modal-grid">{children}</div>

        <footer className="exam-modal-footer collaborator-modal-footer">{footer}</footer>
      </DialogContent>
    </Dialog>
  );
}

export function NewCollaboratorDialog({
  open,
  onOpenChange,
  companies,
  defaultCompanyId,
  isEmpresaPortal = false,
  onSuccess,
}: NewCollaboratorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CollaboratorFormState>({
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
      setForm({
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
    }
  }, [open, defaultCompanyId]);

  const set = (key: keyof CollaboratorFormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

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

  const companyName = companies.find((c) => c.id === form.companyId)?.name;

  return (
    <CollaboratorModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Novo colaborador"
      description={
        isEmpresaPortal
          ? "Cadastro admissional ou individual para solicitações de exame e controle de ASO."
          : "Cadastre o colaborador vinculado à empresa. Quem solicita o exame é o RH no portal."
      }
      badges={[
        { label: isEmpresaPortal ? "Portal RH" : "Cadastro", variant: "category" },
        { label: "Admissional", variant: "status" },
      ]}
      footer={
        <div className="collaborator-modal-actions">
          <Button variant="outline" className="collaborator-modal-btn" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {isEmpresaPortal ? (
            <>
              <Button
                variant="outline"
                className="collaborator-modal-btn"
                onClick={() => save(false)}
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar colaborador"}
              </Button>
              <Button
                variant="brand"
                className="collaborator-modal-btn"
                onClick={() => save(true)}
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar e encaminhar"}
              </Button>
            </>
          ) : (
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => save(false)}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar colaborador"}
            </Button>
          )}
        </div>
      }
    >
      <CollaboratorFormField label="Nome completo" required wide>
        <input
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="Nome completo do colaborador"
        />
      </CollaboratorFormField>

      <CollaboratorFormField label="CPF" required>
        <input
          value={form.cpf}
          onChange={(e) => set("cpf", e.target.value)}
          placeholder="000.000.000-00"
        />
      </CollaboratorFormField>

      <CollaboratorFormField label="Data de nascimento">
        <input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
      </CollaboratorFormField>

      <CollaboratorFormField label="Telefone">
        <input
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="(00) 00000-0000"
        />
      </CollaboratorFormField>

      <CollaboratorFormField label="E-mail">
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="email@empresa.com"
        />
      </CollaboratorFormField>

      {!isEmpresaPortal ? (
        <CollaboratorFormField label="Empresa" required wide>
          <select value={form.companyId} onChange={(e) => set("companyId", e.target.value)}>
            <option value="">Selecione a empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </CollaboratorFormField>
      ) : (
        companyName && (
          <CollaboratorFormField label="Empresa" wide>
            <input value={companyName} readOnly className="collaborator-modal-readonly" />
          </CollaboratorFormField>
        )
      )}

      <CollaboratorFormField label="Função" required>
        <input
          value={form.jobTitle}
          onChange={(e) => set("jobTitle", e.target.value)}
          placeholder="Ex.: Operador de máquinas"
        />
      </CollaboratorFormField>

      <CollaboratorFormField label="Setor">
        <input
          value={form.department}
          onChange={(e) => set("department", e.target.value)}
          placeholder="Ex.: Produção"
        />
      </CollaboratorFormField>

      <CollaboratorFormField label="Data de admissão">
        <input type="date" value={form.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} />
      </CollaboratorFormField>

      <CollaboratorFormField label="Próximo periódico">
        <input type="date" value={form.nextPeriodicDate} onChange={(e) => set("nextPeriodicDate", e.target.value)} />
      </CollaboratorFormField>

      <CollaboratorFormField label="Observações internas" wide>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Informações relevantes para RH ou clínica"
        />
      </CollaboratorFormField>
    </CollaboratorModalShell>
  );
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function CollaboratorFormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="collaborator-form-section exam-modal-item--wide">
      <p className="collaborator-form-section-title">{title}</p>
      <div className="collaborator-form-section-grid">{children}</div>
    </div>
  );
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
    <CollaboratorModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Editar colaborador"
      description="Atualize os dados cadastrais e ocupacionais do colaborador."
      badges={[
        { label: "Edição", variant: "category" },
        { label: PATIENT_STATUS_LABELS[form.status as PatientStatus], variant: "status" },
      ]}
      footer={
        <div className="collaborator-modal-actions">
          <Button variant="outline" className="collaborator-modal-btn" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="brand" className="collaborator-modal-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      }
    >
      <CollaboratorFormSection title="Dados pessoais">
        <CollaboratorFormField label="Nome completo" required wide>
          <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </CollaboratorFormField>

        <CollaboratorFormField label="CPF" required>
          <input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} />
        </CollaboratorFormField>

        <CollaboratorFormField label="Data de nascimento">
          <input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
        </CollaboratorFormField>

        <CollaboratorFormField label="Telefone">
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </CollaboratorFormField>

        <CollaboratorFormField label="E-mail">
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </CollaboratorFormField>
      </CollaboratorFormSection>

      <CollaboratorFormSection title="Dados profissionais">
        <CollaboratorFormField label="Função" required>
          <input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
        </CollaboratorFormField>

        <CollaboratorFormField label="Setor">
          <input value={form.department} onChange={(e) => set("department", e.target.value)} />
        </CollaboratorFormField>

        <CollaboratorFormField label="Data de admissão">
          <input type="date" value={form.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} />
        </CollaboratorFormField>

        <CollaboratorFormField label="Próximo periódico">
          <input type="date" value={form.nextPeriodicDate} onChange={(e) => set("nextPeriodicDate", e.target.value)} />
        </CollaboratorFormField>

        <CollaboratorFormField label="Status" wide>
          <select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {(Object.keys(PATIENT_STATUS_LABELS) as PatientStatus[]).map((s) => (
              <option key={s} value={s}>
                {PATIENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </CollaboratorFormField>

        <CollaboratorFormField label="Observações internas" wide>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
        </CollaboratorFormField>
      </CollaboratorFormSection>
    </CollaboratorModalShell>
  );
}
