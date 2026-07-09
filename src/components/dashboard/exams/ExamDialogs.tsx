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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar exame" : "Novo exame"}</DialogTitle>
          <DialogDescription>
            Cadastre exames para alimentar encaminhamentos, agenda e página pública de preparos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Dados principais
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nome do exame</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex.: Audiometria"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {CATEGORIES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {STATUSES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição curta</Label>
                <Textarea
                  value={form.shortDescription}
                  onChange={(e) => set("shortDescription", e.target.value)}
                  rows={2}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.showOnWebsite}
                  onCheckedChange={(c) => set("showOnWebsite", c === true)}
                />
                Exibir no site
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.availableOnPublicForm}
                  onCheckedChange={(c) => set("availableOnPublicForm", c === true)}
                />
                Disponível no formulário público
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <Checkbox
                  checked={form.availableOnCompanyPortal}
                  onCheckedChange={(c) => set("availableOnCompanyPortal", c === true)}
                />
                Disponível no portal empresarial
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preparo</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Tipo de preparo</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.preparationType}
                  onChange={(e) => set("preparationType", e.target.value)}
                >
                  {PREPARATION_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label>Preparo antes do exame</Label>
                <Textarea
                  value={form.preparationBefore}
                  onChange={(e) => set("preparationBefore", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Orientações no dia do exame</Label>
                <Textarea
                  value={form.instructionsOnDay}
                  onChange={(e) => set("instructionsOnDay", e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Prazo médio</Label>
                <Input
                  value={form.averageDeadline}
                  onChange={(e) => set("averageDeadline", e.target.value)}
                  placeholder="Ex.: No dia do exame"
                />
              </div>
              <div>
                <Label>Unidade de prazo</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.deadlineType}
                  onChange={(e) => set("deadlineType", e.target.value)}
                >
                  <option value="">Automático</option>
                  {DEADLINE_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label>Observações importantes</Label>
                <Textarea
                  value={form.observations}
                  onChange={(e) => set("observations", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Quando informar a clínica</Label>
                <Textarea
                  value={form.whenToNotifyClinic}
                  onChange={(e) => set("whenToNotifyClinic", e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Operacional
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.requiresAppointment}
                  onCheckedChange={(c) => set("requiresAppointment", c === true)}
                />
                Requer agendamento
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.requiresProfessional}
                  onCheckedChange={(c) => set("requiresProfessional", c === true)}
                />
                Requer profissional específico
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.requiresAttachment}
                  onCheckedChange={(c) => set("requiresAttachment", c === true)}
                />
                Requer anexos/documentos
              </label>
              <div>
                <Label>Ordem de exibição</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => set("displayOrder", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Tags internas</Label>
                <Input
                  value={form.internalTags}
                  onChange={(e) => set("internalTags", e.target.value)}
                  placeholder="Separadas por vírgula"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={() => handleSave(false)} disabled={loading}>
            Salvar exame
          </Button>
          <Button variant="brand" onClick={() => handleSave(true)} disabled={loading}>
            Salvar e publicar no site
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
