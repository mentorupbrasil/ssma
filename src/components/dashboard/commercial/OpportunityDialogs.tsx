"use client";

import { useEffect, useState } from "react";
import type { OpportunityFormInput } from "@/actions/commercial";
import {
  createOpportunity,
  updateOpportunity,
  updateOpportunityStage,
  registerOpportunityContact,
  scheduleFollowUp,
  completeFollowUp,
  rescheduleFollowUp,
  convertOpportunityToCompany,
} from "@/actions/commercial";
import type { LeadDetailSerialized } from "@/lib/commercial";
import type { CommercialStage } from "@prisma/client";
import {
  COMMERCIAL_STAGE_LABELS,
  COMMERCIAL_STAGES,
  LEAD_SOURCE_LABELS,
  SUGGESTED_QUOTE_SERVICES,
} from "@/lib/commercial";
import {
  SystemModalField,
  SystemModalShell,
} from "@/components/dashboard/SystemModalShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Assignee = { id: string; name: string };

type OpportunityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: LeadDetailSerialized | null;
  assignees: Assignee[];
  onSuccess: (leadId?: string) => void;
};

export function OpportunityFormDialog({
  open,
  onOpenChange,
  opportunity,
  assignees,
  onSuccess,
}: OpportunityFormDialogProps) {
  const isEdit = !!opportunity;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<OpportunityFormInput>({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    city: "",
    cnpj: "",
    serviceInterest: "",
    message: "",
    source: "manual",
    assignedToUserId: "",
    stage: "NOVO_LEAD",
    nextFollowUpAt: "",
    followUpAction: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    if (opportunity) {
      setForm({
        name: opportunity.name,
        companyName: opportunity.companyName ?? "",
        phone: opportunity.phone ?? "",
        email: opportunity.email ?? "",
        city: opportunity.city ?? "",
        cnpj: opportunity.cnpj ?? "",
        estimatedEmployees: opportunity.estimatedEmployees ?? undefined,
        serviceInterest: opportunity.serviceInterest ?? "",
        message: opportunity.message ?? "",
        source: opportunity.source,
        assignedToUserId: opportunity.assignedToUserId ?? "",
        stage: opportunity.stage,
        nextFollowUpAt: opportunity.nextFollowUpAt
          ? opportunity.nextFollowUpAt.slice(0, 16)
          : "",
        followUpAction: opportunity.followUpAction ?? "",
        notes: "",
      });
    } else {
      setForm({
        name: "",
        companyName: "",
        phone: "",
        email: "",
        city: "",
        cnpj: "",
        serviceInterest: "",
        message: "",
        source: "manual",
        assignedToUserId: "",
        stage: "NOVO_LEAD",
        nextFollowUpAt: "",
        followUpAction: "",
        notes: "",
      });
    }
  }, [open, opportunity]);

  const set = <K extends keyof OpportunityFormInput>(key: K, value: OpportunityFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      ...form,
      nextFollowUpAt: form.nextFollowUpAt || undefined,
      assignedToUserId: form.assignedToUserId || undefined,
    };

    if (isEdit && opportunity) {
      const result = await updateOpportunity(opportunity.id, payload);
      setLoading(false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Oportunidade atualizada.");
      onOpenChange(false);
      onSuccess(opportunity.id);
      return;
    }

    const result = await createOpportunity(payload);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Oportunidade criada.");
    onOpenChange(false);
    onSuccess(result.leadId);
  };

  return (
    <SystemModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar oportunidade" : "Nova oportunidade"}
      description="Cadastre o prospect e o interesse comercial."
      badges={[
        { label: "Comercial", variant: "category" },
        { label: isEdit ? "Edição" : "Novo lead", variant: "status" },
      ]}
      className="max-w-2xl"
      footer={
        <div className="collaborator-modal-actions">
          <Button variant="outline" className="collaborator-modal-btn" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleSave()} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      }
    >
      <SystemModalField label="Empresa / prospect" required wide>
        <input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Contato principal" required>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Telefone / WhatsApp">
        <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
      </SystemModalField>
      <SystemModalField label="E-mail">
        <input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Cidade">
        <input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
      </SystemModalField>
      <SystemModalField label="CNPJ">
        <input value={form.cnpj ?? ""} onChange={(e) => set("cnpj", e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Nº estimado de colaboradores">
        <input
          type="number"
          min={0}
          value={form.estimatedEmployees ?? ""}
          onChange={(e) =>
            set("estimatedEmployees", e.target.value ? parseInt(e.target.value, 10) : undefined)
          }
        />
      </SystemModalField>
      <SystemModalField label="Interesse / serviço" wide>
        <input
          list="commercial-interest-suggestions"
          value={form.serviceInterest ?? ""}
          onChange={(e) => set("serviceInterest", e.target.value)}
          placeholder="Ex.: exames ocupacionais, PCMSO, contrato empresarial"
        />
        <datalist id="commercial-interest-suggestions">
          {SUGGESTED_QUOTE_SERVICES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </SystemModalField>
      <SystemModalField label="Origem">
        <select value={form.source ?? "manual"} onChange={(e) => set("source", e.target.value)}>
          {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </SystemModalField>
      <SystemModalField label="Responsável">
        <select
          value={form.assignedToUserId ?? ""}
          onChange={(e) => set("assignedToUserId", e.target.value)}
        >
          <option value="">Sem responsável</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </SystemModalField>
      <SystemModalField label="Etapa">
        <select
          value={form.stage ?? "NOVO_LEAD"}
          onChange={(e) => set("stage", e.target.value as CommercialStage)}
        >
          {COMMERCIAL_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {COMMERCIAL_STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
      </SystemModalField>
      <SystemModalField label="Próximo follow-up">
        <input
          type="datetime-local"
          value={form.nextFollowUpAt ?? ""}
          onChange={(e) => set("nextFollowUpAt", e.target.value)}
        />
      </SystemModalField>
      <SystemModalField label="Ação do follow-up">
        <input
          value={form.followUpAction ?? ""}
          onChange={(e) => set("followUpAction", e.target.value)}
          placeholder="Ligar, enviar proposta, WhatsApp..."
        />
      </SystemModalField>
      <SystemModalField label="Observações" wide>
        <textarea
          rows={3}
          value={form.message ?? ""}
          onChange={(e) => set("message", e.target.value)}
        />
      </SystemModalField>
    </SystemModalShell>
  );
}

export function RegisterContactDialog({
  open,
  onOpenChange,
  leadId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [followUpAction, setFollowUpAction] = useState("");

  useEffect(() => {
    if (!open) return;
    setContent("");
    setNextFollowUpAt("");
    setFollowUpAction("");
  }, [open]);

  const handleSave = async () => {
    if (!leadId) return;
    setLoading(true);
    const result = await registerOpportunityContact(leadId, content, {
      nextFollowUpAt: nextFollowUpAt || undefined,
      followUpAction: followUpAction || undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Contato registrado.");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <SystemModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar contato"
      description="Registre o resultado da interação comercial."
      badges={[{ label: "Follow-up", variant: "status" }]}
      footer={
        <div className="collaborator-modal-actions">
          <Button variant="outline" className="collaborator-modal-btn" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleSave()} disabled={loading}>
            Salvar contato
          </Button>
        </div>
      }
    >
      <SystemModalField label="O que foi conversado" required wide>
        <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Agendar próximo follow-up">
        <input type="datetime-local" value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Ação prevista">
        <input value={followUpAction} onChange={(e) => setFollowUpAction(e.target.value)} />
      </SystemModalField>
    </SystemModalShell>
  );
}

export function ScheduleFollowUpDialog({
  open,
  onOpenChange,
  leadId,
  assignees,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string | null;
  assignees: Assignee[];
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [action, setAction] = useState("Retorno comercial");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setDueAt("");
    setAction("Retorno comercial");
    setAssignedToUserId("");
    setNotes("");
  }, [open]);

  const handleSave = async () => {
    if (!leadId) return;
    setLoading(true);
    const result = await scheduleFollowUp({
      leadId,
      dueAt,
      action,
      assignedToUserId: assignedToUserId || undefined,
      notes: notes || undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Follow-up agendado.");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <SystemModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Agendar follow-up"
      description="Defina quando e como retomar o contato."
      badges={[{ label: "Agenda comercial", variant: "category" }]}
      footer={
        <div className="collaborator-modal-actions">
          <Button variant="outline" className="collaborator-modal-btn" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleSave()} disabled={loading}>
            Agendar
          </Button>
        </div>
      }
    >
      <SystemModalField label="Data e hora" required>
        <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Ação prevista" required wide>
        <input value={action} onChange={(e) => setAction(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Responsável">
        <select value={assignedToUserId} onChange={(e) => setAssignedToUserId(e.target.value)}>
          <option value="">Responsável da oportunidade</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </SystemModalField>
      <SystemModalField label="Observação" wide>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </SystemModalField>
    </SystemModalShell>
  );
}

export function CompleteFollowUpDialog({
  open,
  onOpenChange,
  followUpId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  followUpId: string | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [notes, setNotes] = useState("");
  const [nextDueAt, setNextDueAt] = useState("");
  const [nextAction, setNextAction] = useState("");

  useEffect(() => {
    if (!open) return;
    setResultText("");
    setNotes("");
    setNextDueAt("");
    setNextAction("");
  }, [open]);

  const handleSave = async () => {
    if (!followUpId) return;
    setLoading(true);
    const result = await completeFollowUp({
      followUpId,
      result: resultText,
      notes: notes || undefined,
      nextDueAt: nextDueAt || undefined,
      nextAction: nextAction || undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Follow-up concluído.");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <SystemModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Marcar follow-up como realizado"
      description="Registre o resultado e, se quiser, agende o próximo contato."
      badges={[{ label: "Follow-up", variant: "status" }]}
      footer={
        <div className="collaborator-modal-actions">
          <Button variant="outline" className="collaborator-modal-btn" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleSave()} disabled={loading}>
            Concluir
          </Button>
        </div>
      }
    >
      <SystemModalField label="Resultado" required wide>
        <textarea rows={3} value={resultText} onChange={(e) => setResultText(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Observação" wide>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Próximo follow-up">
        <input type="datetime-local" value={nextDueAt} onChange={(e) => setNextDueAt(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Próxima ação">
        <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
      </SystemModalField>
    </SystemModalShell>
  );
}

export function RescheduleFollowUpDialog({
  open,
  onOpenChange,
  followUpId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  followUpId: string | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [action, setAction] = useState("");

  useEffect(() => {
    if (!open) return;
    setDueAt("");
    setAction("");
  }, [open]);

  const handleSave = async () => {
    if (!followUpId) return;
    setLoading(true);
    const result = await rescheduleFollowUp({
      followUpId,
      dueAt,
      action: action || undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Follow-up reagendado.");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <SystemModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Reagendar follow-up"
      description="Escolha a nova data de retorno."
      badges={[{ label: "Agenda", variant: "category" }]}
      footer={
        <div className="collaborator-modal-actions">
          <Button variant="outline" className="collaborator-modal-btn" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleSave()} disabled={loading}>
            Reagendar
          </Button>
        </div>
      }
    >
      <SystemModalField label="Nova data" required>
        <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Ação prevista" wide>
        <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Manter a ação atual se vazio" />
      </SystemModalField>
    </SystemModalShell>
  );
}

export function MarkLostDialog({
  open,
  onOpenChange,
  leadId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const handleSave = async () => {
    if (!leadId) return;
    setLoading(true);
    const result = await updateOpportunityStage(leadId, "PERDIDO", { lostReason: reason });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Oportunidade marcada como perdida.");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <SystemModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Marcar como perdido"
      description="Informe o motivo para o histórico comercial."
      badges={[{ label: "Perda", variant: "status" }]}
      footer={
        <div className="collaborator-modal-actions">
          <Button variant="outline" className="collaborator-modal-btn" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleSave()} disabled={loading}>
            Confirmar
          </Button>
        </div>
      }
    >
      <SystemModalField label="Motivo" required wide>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </SystemModalField>
    </SystemModalShell>
  );
}

export function ConvertCompanyDialog({
  open,
  onOpenChange,
  opportunity,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  opportunity: LeadDetailSerialized | null;
  onSuccess: (companyId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [responsibleName, setResponsibleName] = useState("");

  useEffect(() => {
    if (!open || !opportunity) return;
    setLegalName(opportunity.companyName ?? "");
    setCnpj(opportunity.cnpj ?? "");
    setEmail(opportunity.email ?? "");
    setPhone(opportunity.phone ?? "");
    setCity(opportunity.city ?? "");
    setResponsibleName(opportunity.name);
  }, [open, opportunity]);

  const handleSave = async () => {
    if (!opportunity) return;
    setLoading(true);
    const result = await convertOpportunityToCompany({
      leadId: opportunity.id,
      legalName,
      cnpj,
      email,
      phone,
      whatsapp: phone,
      city,
      responsibleName,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.linkedExisting
        ? "Empresa existente vinculada à oportunidade."
        : "Empresa criada a partir da oportunidade."
    );
    onOpenChange(false);
    onSuccess(result.companyId);
  };

  return (
    <SystemModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Converter em empresa"
      description="Reaproveita os dados da oportunidade. Se o CNPJ já existir, apenas vincula."
      badges={[{ label: "Conversão", variant: "status" }]}
      className="max-w-xl"
      footer={
        <div className="collaborator-modal-actions">
          <Button variant="outline" className="collaborator-modal-btn" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleSave()} disabled={loading}>
            Converter
          </Button>
        </div>
      }
    >
      <SystemModalField label="Razão social" required wide>
        <input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="CNPJ" required>
        <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Responsável">
        <input value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Telefone">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="E-mail">
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Cidade">
        <input value={city} onChange={(e) => setCity(e.target.value)} />
      </SystemModalField>
    </SystemModalShell>
  );
}
