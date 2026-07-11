"use client";

import { useEffect, useState } from "react";
import { createCompanyFull } from "@/actions/companies";
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

type NewCompanyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (id: string) => void;
};

type CompanyFormState = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  stateRegistration: string;
  size: string;
  segment: string;
  responsibleName: string;
  responsibleRole: string;
  whatsapp: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  contractType: string;
  notes: string;
  status: string;
  portalEnabled: boolean;
};

const EMPTY_FORM: CompanyFormState = {
  legalName: "",
  tradeName: "",
  cnpj: "",
  stateRegistration: "",
  size: "",
  segment: "",
  responsibleName: "",
  responsibleRole: "",
  whatsapp: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  contractType: "",
  notes: "",
  status: "ATIVA",
  portalEnabled: false,
};

function CompanyFormField({
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

export function NewCompanyDialog({ open, onOpenChange, onSuccess }: NewCompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  const set = (key: keyof CompanyFormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setLoading(true);
    const result = await createCompanyFull({
      ...form,
      size: form.size || undefined,
      contractType: form.contractType || undefined,
    });
    setLoading(false);
    if (result.success) {
      toast.success("Empresa cadastrada!");
      onOpenChange(false);
      setForm(EMPTY_FORM);
      onSuccess(result.id);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="exam-modal collaborator-modal" showCloseButton>
        <header className="exam-modal-head">
          <div className="exam-modal-head-top">
            <div className="exam-drawer-badges">
              <span className="exam-drawer-badge exam-drawer-badge--category">Cadastro</span>
              <span className="exam-drawer-badge exam-drawer-badge--status">Empresa</span>
            </div>
          </div>
          <DialogTitle className="exam-modal-title">Nova empresa</DialogTitle>
          <DialogDescription className="collaborator-modal-subtitle">
            Cadastre os dados da empresa cliente. Campos com * são obrigatórios.
          </DialogDescription>
        </header>

        <div className="exam-modal-grid collaborator-modal-grid">
          <CompanyFormField label="Razão social" required wide>
            <input
              value={form.legalName}
              onChange={(e) => set("legalName", e.target.value)}
              placeholder="Razão social completa"
            />
          </CompanyFormField>

          <CompanyFormField label="Nome fantasia" wide>
            <input
              value={form.tradeName}
              onChange={(e) => set("tradeName", e.target.value)}
              placeholder="Nome fantasia"
            />
          </CompanyFormField>

          <CompanyFormField label="CNPJ" required>
            <input
              value={form.cnpj}
              onChange={(e) => set("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </CompanyFormField>

          <CompanyFormField label="Inscrição estadual">
            <input
              value={form.stateRegistration}
              onChange={(e) => set("stateRegistration", e.target.value)}
              placeholder="Inscrição estadual"
            />
          </CompanyFormField>

          <CompanyFormField label="Porte">
            <select value={form.size} onChange={(e) => set("size", e.target.value)}>
              <option value="">Selecione</option>
              <option value="PEQUENA">Pequena</option>
              <option value="MEDIA">Média</option>
              <option value="GRANDE">Grande</option>
            </select>
          </CompanyFormField>

          <CompanyFormField label="Segmento">
            <input
              value={form.segment}
              onChange={(e) => set("segment", e.target.value)}
              placeholder="Ex.: Indústria, Comércio"
            />
          </CompanyFormField>

          <CompanyFormField label="Responsável principal">
            <input
              value={form.responsibleName}
              onChange={(e) => set("responsibleName", e.target.value)}
              placeholder="Nome do responsável"
            />
          </CompanyFormField>

          <CompanyFormField label="Cargo do responsável">
            <input
              value={form.responsibleRole}
              onChange={(e) => set("responsibleRole", e.target.value)}
              placeholder="Ex.: Gerente de RH"
            />
          </CompanyFormField>

          <CompanyFormField label="WhatsApp" required>
            <input
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </CompanyFormField>

          <CompanyFormField label="E-mail">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="contato@empresa.com"
            />
          </CompanyFormField>

          <CompanyFormField label="Telefone secundário">
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(00) 0000-0000"
            />
          </CompanyFormField>

          <CompanyFormField label="CEP">
            <input
              value={form.zipCode}
              onChange={(e) => set("zipCode", e.target.value)}
              placeholder="00000-000"
            />
          </CompanyFormField>

          <CompanyFormField label="Endereço" wide>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Rua, número e complemento"
            />
          </CompanyFormField>

          <CompanyFormField label="Cidade">
            <input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Cidade"
            />
          </CompanyFormField>

          <CompanyFormField label="Estado">
            <input
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              placeholder="UF"
              maxLength={2}
            />
          </CompanyFormField>

          <CompanyFormField label="Tipo de contrato">
            <select
              value={form.contractType}
              onChange={(e) => set("contractType", e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="AVULSO">Avulso</option>
              <option value="MENSAL">Mensal</option>
              <option value="ANUAL">Anual</option>
              <option value="EM_NEGOCIACAO">Em negociação</option>
            </select>
          </CompanyFormField>

          <CompanyFormField label="Status inicial">
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="ATIVA">Ativa</option>
              <option value="PENDENTE">Pendente</option>
              <option value="INATIVA">Inativa</option>
            </select>
          </CompanyFormField>

          <CompanyFormField label="Observações internas" wide>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Anotações internas da clínica"
            />
          </CompanyFormField>

          <div className="exam-modal-item exam-modal-item--wide">
            <label className="collaborator-modal-check">
              <input
                type="checkbox"
                checked={form.portalEnabled}
                onChange={(e) => set("portalEnabled", e.target.checked)}
              />
              <span>Ativar portal empresarial agora</span>
            </label>
          </div>
        </div>

        <footer className="exam-modal-footer collaborator-modal-footer">
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Cadastrar empresa"}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

type EditCompanyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    legalName: string;
    tradeName: string | null;
    cnpj: string;
    whatsapp: string | null;
    email: string | null;
    phone: string | null;
    responsibleName: string | null;
    notes: string | null;
    status: string;
  };
  companyId: string;
  onSuccess: () => void;
};

export function EditCompanyDialog({
  open,
  onOpenChange,
  company,
  companyId,
  onSuccess,
}: EditCompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    legalName: company.legalName,
    tradeName: company.tradeName ?? "",
    cnpj: company.cnpj,
    whatsapp: company.whatsapp ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    responsibleName: company.responsibleName ?? "",
    notes: company.notes ?? "",
    status: company.status,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      legalName: company.legalName,
      tradeName: company.tradeName ?? "",
      cnpj: company.cnpj,
      whatsapp: company.whatsapp ?? "",
      email: company.email ?? "",
      phone: company.phone ?? "",
      responsibleName: company.responsibleName ?? "",
      notes: company.notes ?? "",
      status: company.status,
    });
  }, [open, company]);

  const handleSave = async () => {
    setLoading(true);
    const { updateCompany } = await import("@/actions/companies");
    const result = await updateCompany(companyId, form);
    setLoading(false);
    if (result.success) {
      toast.success("Empresa atualizada!");
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
          <DialogTitle>Editar empresa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Razão social</Label>
            <Input
              value={form.legalName}
              onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Nome fantasia</Label>
            <Input
              value={form.tradeName}
              onChange={(e) => setForm((f) => ({ ...f, tradeName: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp</Label>
            <Input
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
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

type ContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
};

export function CompanyContactDialog({
  open,
  onOpenChange,
  companyId,
  onSuccess,
}: ContactDialogProps) {
  const [type, setType] = useState("COMERCIAL");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const { addCompanyContact } = await import("@/actions/companies");
    const result = await addCompanyContact(companyId, { type, title, notes });
    setLoading(false);
    if (result.success) {
      toast.success("Contato registrado!");
      onOpenChange(false);
      setTitle("");
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
          <DialogTitle>Registrar contato</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="COMERCIAL">Comercial</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="TELEFONE">Telefone</option>
              <option value="EMAIL">E-mail</option>
              <option value="VISITA">Visita</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
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
