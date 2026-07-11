"use client";

import { useEffect, useState } from "react";
import { createExam, updateExam } from "@/actions/exams";
import type { ExamDetailSerialized } from "@/lib/exams";
import { EXAM_CATEGORY_LABELS, EXAM_STATUS_LABELS } from "@/lib/exams";
import {
  SystemModalShell,
  SystemModalField,
} from "@/components/dashboard/SystemModalShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ExamFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: ExamDetailSerialized | null;
  onSuccess: () => void;
};

const CATEGORIES = Object.entries(EXAM_CATEGORY_LABELS);
const STATUS_OPTIONS = [
  { value: "ATIVO", label: EXAM_STATUS_LABELS.ATIVO },
  { value: "INATIVO", label: EXAM_STATUS_LABELS.INATIVO },
] as const;

type FormState = {
  name: string;
  category: string;
  status: string;
};

const defaultForm: FormState = {
  name: "",
  category: "COMPLEMENTAR",
  status: "ATIVO",
};

export function ExamFormDialog({ open, onOpenChange, exam, onSuccess }: ExamFormDialogProps) {
  const isEdit = !!exam;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  useEffect(() => {
    if (!open) return;
    if (exam) {
      setForm({
        name: exam.name,
        category: exam.category,
        status: exam.status === "EM_REVISAO" ? "ATIVO" : exam.status,
      });
    } else {
      setForm(defaultForm);
    }
  }, [open, exam]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome do exame.");
      return;
    }

    setLoading(true);

    const payload = isEdit && exam
      ? {
          name: form.name.trim(),
          category: form.category,
          status: form.status,
          shortDescription: exam.shortDescription ?? undefined,
          showOnWebsite: exam.showOnWebsite,
          availableOnPublicForm: exam.availableOnPublicForm,
          availableOnCompanyPortal: exam.availableOnCompanyPortal,
          preparationType: exam.preparationType,
          preparationBefore: exam.preparationBefore ?? undefined,
          instructionsOnDay: exam.instructionsOnDay ?? undefined,
          averageDeadline: exam.averageDeadline ?? undefined,
          deadlineType: exam.deadlineType,
          observations: exam.observations ?? undefined,
          whenToNotifyClinic: exam.whenToNotifyClinic ?? undefined,
          requiresAppointment: exam.requiresAppointment,
          requiresProfessional: exam.requiresProfessional,
          requiresAttachment: exam.requiresAttachment,
          displayOrder: exam.displayOrder,
          internalTags: exam.internalTags ?? undefined,
          publishOnSave: false,
        }
      : {
          name: form.name.trim(),
          category: form.category,
          status: form.status,
          showOnWebsite: false,
          availableOnPublicForm: true,
          availableOnCompanyPortal: true,
          preparationType: "SEM_PREPARO",
          requiresAppointment: false,
          requiresProfessional: false,
          requiresAttachment: false,
          publishOnSave: false,
        };

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
    onSuccess();
  };

  return (
    <SystemModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar exame" : "Novo exame"}
      description="Cadastre o exame para uso nos atendimentos e contratos."
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
            onClick={() => void handleSave()}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar exame"}
          </Button>
        </div>
      }
    >
      <SystemModalField label="Nome do exame" required wide>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ex.: Audiometria"
        />
      </SystemModalField>

      <SystemModalField label="Categoria" required>
        <select value={form.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </SystemModalField>

      <SystemModalField label="Status" required>
        <select value={form.status} onChange={(e) => set("status", e.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </SystemModalField>
    </SystemModalShell>
  );
}
