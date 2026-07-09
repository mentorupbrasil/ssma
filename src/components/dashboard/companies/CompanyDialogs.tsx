"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function NewCompanyDialog({ open, onOpenChange, onSuccess }: NewCompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
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
  });

  const reset = () => {
    setForm({
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
    });
  };

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
      reset();
      onSuccess(result.id);
    } else {
      toast.error(result.error);
    }
  };

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova empresa</DialogTitle>
          <DialogDescription>
            Cadastre os dados da empresa cliente. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Razão social *</Label>
            <Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome fantasia</Label>
            <Input value={form.tradeName} onChange={(e) => set("tradeName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CNPJ *</Label>
            <Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-2">
            <Label>Inscrição estadual</Label>
            <Input value={form.stateRegistration} onChange={(e) => set("stateRegistration", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Porte</Label>
            <select
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione</option>
              <option value="PEQUENA">Pequena</option>
              <option value="MEDIA">Média</option>
              <option value="GRANDE">Grande</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Segmento</Label>
            <Input value={form.segment} onChange={(e) => set("segment", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Responsável principal</Label>
            <Input value={form.responsibleName} onChange={(e) => set("responsibleName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cargo do responsável</Label>
            <Input value={form.responsibleRole} onChange={(e) => set("responsibleRole", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp *</Label>
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Telefone secundário</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Input value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2} />
          </div>
          <div className="space-y-2">
            <Label>Tipo de contrato</Label>
            <select
              value={form.contractType}
              onChange={(e) => set("contractType", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione</option>
              <option value="AVULSO">Avulso</option>
              <option value="MENSAL">Mensal</option>
              <option value="ANUAL">Anual</option>
              <option value="EM_NEGOCIACAO">Em negociação</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Status inicial</Label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="ATIVA">Ativa</option>
              <option value="PENDENTE">Pendente</option>
              <option value="INATIVA">Inativa</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Observações internas</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.portalEnabled}
              onChange={(e) => set("portalEnabled", e.target.checked)}
            />
            Ativar portal empresarial agora
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Cadastrar empresa"}
          </Button>
        </DialogFooter>
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
              <option value="SITE">Site</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Observação *</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
