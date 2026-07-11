"use client";

import { useEffect, useState } from "react";
import { createExam, updateExam } from "@/actions/exams";
import type { ExamDetailSerialized } from "@/lib/exams";
import {
  EXAM_CATEGORY_LABELS,
  EXAM_PREPARATION_LABELS,
  EXAM_DEADLINE_TYPE_LABELS,
  EXAM_STATUS_LABELS,
} from "@/lib/exams";
import {
  SystemModalShell,
  SystemModalField,
} from "@/components/dashboard/SystemModalShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type ExamFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: ExamDetailSerialized | null;
  onSuccess: (examId?: string) => void;
};

const CATEGORIES = Object.entries(EXAM_CATEGORY_LABELS);
const PREPARATION_TYPES = Object.entries(EXAM_PREPARATION_LABELS);
const DEADLINE_TYPES = Object.entries(EXAM_DEADLINE_TYPE_LABELS);
const STATUSES = Object.entries(EXAM_STATUS_LABELS);

const defaultForm = {
  name: "",
  category: "COMPLEMENTAR",
  shortDescription: "",
  status: "ATIVO",
  showOnWebsite: false,
  availableOnPublicForm: true,
  availableOnCompanyPortal: true,
  preparationType: "SEM_PREPARO",
  preparationBefore: "",
  instructionsOnDay: "",
  averageDeadline: "",
  deadlineType: "" as string,
  observations: "",
  whenToNotifyClinic: "",
  requiresAppointment: false,
  requiresProfessional: false,
  requiresAttachment: false,
  displayOrder: "" as string,
  internalTags: "",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="exam-modal-item exam-modal-item--wide border-0 bg-transparent px-0 py-1">
      <p className="exam-modal-item-label mb-0">{children}</p>
    </div>
  );
}

function CheckboxWide({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <div className="exam-modal-item exam-modal-item--wide">
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <Checkbox checked={checked} onCheckedChange={(c) => onCheckedChange(c === true)} />
        {label}
      </label>
    </div>
  );
}

export function ExamFormDialog({ open, onOpenChange, exam, onSuccess }: ExamFormDialogProps) {
  const isEdit = !!exam;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!open) return;
    if (exam) {
      setForm({
        name: exam.name,
        category: exam.category,
        shortDescription: exam.shortDescription ?? "",
        status: exam.status,
        showOnWebsite: exam.showOnWebsite,
        availableOnPublicForm: exam.availableOnPublicForm,
        availableOnCompanyPortal: exam.availableOnCompanyPortal,
        preparationType: exam.preparationType,
        preparationBefore: exam.preparationBefore ?? "",
        instructionsOnDay: exam.instructionsOnDay ?? "",
        averageDeadline: exam.averageDeadline ?? "",
        deadlineType: exam.deadlineType ?? "",
        observations: exam.observations ?? "",
        whenToNotifyClinic: exam.whenToNotifyClinic ?? "",
        requiresAppointment: exam.requiresAppointment,
        requiresProfessional: exam.requiresProfessional,
        requiresAttachment: exam.requiresAttachment,
        displayOrder: exam.displayOrder != null ? String(exam.displayOrder) : "",
        internalTags: exam.internalTags ?? "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [open, exam]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (publishOnSave: boolean) => ({
    ...form,
    displayOrder: form.displayOrder ? Number(form.displayOrder) : null,
    deadlineType: form.deadlineType || null,
    publishOnSave,
  });

  const handleSave = async (publishOnSave = false) => {
    setLoading(true);
    const payload = buildPayload(publishOnSave);
    const result = isEdit
      ? await updateExam(exam!.id, payload)
      : await createExam(payload);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Exame atualizado." : "Exame cadastrado.");
    onOpenChange(false);
    const savedExamId = isEdit
      ? exam?.id
      : "examId" in result && typeof result.examId === "string"
        ? result.examId
        : undefined;
    onSuccess(savedExamId);
  };

  return (
    <SystemModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar exame" : "Novo exame"}
      description="Catálogo de exames e preparos para o portal e o site."
      badges={[
        { label: isEdit ? "Edição" : "Cadastro", variant: "category" },
        {
          label: EXAM_STATUS_LABELS[form.status as keyof typeof EXAM_STATUS_LABELS] ?? form.status,
          variant: "status",
        },
      ]}
      footer={
        <div className="collaborator-modal-actions">
          <Button
            variant="outline"
            className="collaborator-modal-btn"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="brand"
            className="collaborator-modal-btn"
            onClick={() => handleSave(false)}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar exame"}
          </Button>
          <Button
            variant="brand"
            className="collaborator-modal-btn"
            onClick={() => handleSave(true)}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar e publicar no site"}
          </Button>
        </div>
      }
    >
      <SectionLabel>Dados principais</SectionLabel>

      <SystemModalField label="Nome do exame" required wide>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ex.: Audiometria"
        />
      </SystemModalField>

      <SystemModalField label="Categoria">
        <select value={form.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </SystemModalField>

      <SystemModalField label="Status">
        <select value={form.status} onChange={(e) => set("status", e.target.value)}>
          {STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </SystemModalField>

      <SystemModalField label="Descrição curta" wide>
        <textarea
          value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          rows={2}
        />
      </SystemModalField>

      <CheckboxWide
        checked={form.showOnWebsite}
        onCheckedChange={(c) => set("showOnWebsite", c)}
        label="Exibir no site"
      />
      <CheckboxWide
        checked={form.availableOnPublicForm}
        onCheckedChange={(c) => set("availableOnPublicForm", c)}
        label="Disponível no formulário público"
      />
      <CheckboxWide
        checked={form.availableOnCompanyPortal}
        onCheckedChange={(c) => set("availableOnCompanyPortal", c)}
        label="Disponível no portal empresarial"
      />

      <SectionLabel>Preparo</SectionLabel>

      <SystemModalField label="Tipo de preparo" wide>
        <select
          value={form.preparationType}
          onChange={(e) => set("preparationType", e.target.value)}
        >
          {PREPARATION_TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </SystemModalField>

      <SystemModalField label="Preparo antes do exame" wide>
        <textarea
          value={form.preparationBefore}
          onChange={(e) => set("preparationBefore", e.target.value)}
          rows={3}
        />
      </SystemModalField>

      <SystemModalField label="Orientações no dia do exame" wide>
        <textarea
          value={form.instructionsOnDay}
          onChange={(e) => set("instructionsOnDay", e.target.value)}
          rows={2}
        />
      </SystemModalField>

      <SystemModalField label="Prazo médio">
        <input
          value={form.averageDeadline}
          onChange={(e) => set("averageDeadline", e.target.value)}
          placeholder="Ex.: No dia do exame"
        />
      </SystemModalField>

      <SystemModalField label="Unidade de prazo">
        <select value={form.deadlineType} onChange={(e) => set("deadlineType", e.target.value)}>
          <option value="">Automático</option>
          {DEADLINE_TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </SystemModalField>

      <SystemModalField label="Observações importantes" wide>
        <textarea
          value={form.observations}
          onChange={(e) => set("observations", e.target.value)}
          rows={2}
        />
      </SystemModalField>

      <SystemModalField label="Quando informar a clínica" wide>
        <textarea
          value={form.whenToNotifyClinic}
          onChange={(e) => set("whenToNotifyClinic", e.target.value)}
          rows={2}
        />
      </SystemModalField>

      <SectionLabel>Operacional</SectionLabel>

      <CheckboxWide
        checked={form.requiresAppointment}
        onCheckedChange={(c) => set("requiresAppointment", c)}
        label="Requer agendamento"
      />
      <CheckboxWide
        checked={form.requiresProfessional}
        onCheckedChange={(c) => set("requiresProfessional", c)}
        label="Requer profissional específico"
      />
      <CheckboxWide
        checked={form.requiresAttachment}
        onCheckedChange={(c) => set("requiresAttachment", c)}
        label="Requer anexos/documentos"
      />

      <SystemModalField label="Ordem de exibição">
        <input
          type="number"
          value={form.displayOrder}
          onChange={(e) => set("displayOrder", e.target.value)}
        />
      </SystemModalField>

      <SystemModalField label="Tags internas" wide>
        <input
          value={form.internalTags}
          onChange={(e) => set("internalTags", e.target.value)}
          placeholder="Separadas por vírgula"
        />
      </SystemModalField>
    </SystemModalShell>
  );
}
