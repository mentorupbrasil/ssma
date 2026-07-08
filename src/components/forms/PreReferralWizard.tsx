"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  preReferralStep1Schema,
  preReferralStep2Schema,
  preReferralStep3Schema,
  preReferralFormSchema,
  type PreReferralFormData,
} from "@/schemas";
import { PRE_REFERRAL_EXAM_OPTIONS, buildPreReferralWhatsAppMessage } from "@/data/pre-referral";
import { submitPreReferral } from "@/actions";
import { PRE_REFERRAL_CLINICAL_EXAM_LABELS } from "@/types";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Send, CheckCircle2, MessageCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/helpers";

const STEPS = [
  {
    title: "Empresa e contato",
    schema: preReferralStep1Schema,
    description: "Informe quem está solicitando o encaminhamento.",
  },
  {
    title: "Colaborador e exame",
    schema: preReferralStep2Schema,
    description: "Dados básicos do colaborador e tipo de exame ocupacional.",
  },
  {
    title: "Exames e observações",
    schema: preReferralStep3Schema,
    description: "Complementares opcionais e confirmação final.",
  },
];

const CLINICAL_OPTIONS = Object.entries(PRE_REFERRAL_CLINICAL_EXAM_LABELS);

const EXAM_MODE_OPTIONS = [
  { value: "NAO_SEI", label: "Não sei quais exames precisa" },
  { value: "SELECIONAR", label: "Quero selecionar exames" },
  { value: "ANEXAR_FUTURO", label: "Tenho pedido/guia e quero anexar futuramente" },
] as const;

type SuccessData = {
  protocol: string;
  companyName: string;
  employeeName: string;
  clinicalExamType: string;
};

export function PreReferralWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [attemptedSteps, setAttemptedSteps] = useState<Set<number>>(new Set());
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const form = useForm<PreReferralFormData>({
    resolver: zodResolver(preReferralFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      companyDocument: "",
      email: "",
      employeeDocument: "",
      selectedExams: [],
      examSelectionMode: "NAO_SEI",
    },
  });

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = form;
  const values = watch();
  const progress = ((step + 1) / STEPS.length) * 100;
  const showErrors = attemptedSteps.has(step);

  const fieldError = (name: keyof PreReferralFormData) =>
    showErrors ? errors[name]?.message : undefined;

  const nextStep = async () => {
    setAttemptedSteps((prev) => new Set(prev).add(step));
    const fields = Object.keys(STEPS[step].schema.shape) as (keyof PreReferralFormData)[];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async (data: PreReferralFormData) => {
    setAttemptedSteps((prev) => new Set(prev).add(step));
    setLoading(true);
    const result = await submitPreReferral(data);
    setLoading(false);

    if (result.success) {
      setSuccess({
        protocol: result.protocol,
        companyName: result.companyName,
        employeeName: result.employeeName,
        clinicalExamType: result.clinicalExamType,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleExam = (exam: string) => {
    const current = values.selectedExams ?? [];
    const next = current.includes(exam)
      ? current.filter((v) => v !== exam)
      : [...current, exam];
    setValue("selectedExams", next);
  };

  const resetForm = () => {
    form.reset({
      companyDocument: "",
      email: "",
      employeeDocument: "",
      selectedExams: [],
      examSelectionMode: "NAO_SEI",
    });
    setStep(0);
    setAttemptedSteps(new Set());
    setSuccess(null);
  };

  if (success) {
    const examLabel =
      PRE_REFERRAL_CLINICAL_EXAM_LABELS[
        success.clinicalExamType as keyof typeof PRE_REFERRAL_CLINICAL_EXAM_LABELS
      ] ?? success.clinicalExamType;

    const whatsappMessage = buildPreReferralWhatsAppMessage({
      protocol: success.protocol,
      companyName: success.companyName,
      employeeName: success.employeeName,
      clinicalExamType: examLabel,
    });

    return (
      <div className="pre-referral-success">
        <div className="pre-referral-success-icon">
          <CheckCircle2 className="h-8 w-8 text-[var(--brand-green)]" strokeWidth={1.75} />
        </div>
        <h2 className="pre-referral-success-title">Pré-encaminhamento enviado com sucesso.</h2>
        <p className="pre-referral-success-text">
          Recebemos sua solicitação. Nossa equipe irá confirmar os dados, exames necessários e
          próximos passos pelo WhatsApp informado.
        </p>
        <div className="pre-referral-success-summary">
          <p><span>Protocolo:</span> <strong>{success.protocol}</strong></p>
          <p><span>Empresa:</span> {success.companyName}</p>
          <p><span>Colaborador:</span> {success.employeeName}</p>
          <p><span>Tipo de exame:</span> {examLabel}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={whatsappLink(whatsappMessage)} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="brand" className="w-full rounded-xl">
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar mensagem no WhatsApp
            </Button>
          </a>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl sm:flex-1"
            onClick={resetForm}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Fazer novo encaminhamento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pre-referral-form space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">
            Etapa {step + 1} de {STEPS.length}
          </span>
          <span className="font-semibold text-[var(--brand-green)]">{Math.round(progress)}%</span>
        </div>
        <div className="pre-referral-progress">
          <div className="pre-referral-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card className="premium-card overflow-hidden border-slate-200/80 shadow-[var(--shadow-card)]">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-xl text-[var(--brand-navy)]">
            {step === 0 ? "Pré-encaminhamento rápido" : STEPS[step].title}
          </CardTitle>
          <CardDescription>
            {step === 0
              ? "Preencha os dados principais. A clínica confirma as informações, exames necessários e próximos passos pelo WhatsApp."
              : STEPS[step].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {step === 0 && (
            <>
              <FormField label="Nome da empresa *" error={fieldError("companyName")}>
                <Input className="form-input" placeholder="Razão social ou nome fantasia" {...register("companyName")} />
              </FormField>
              <FormField label="CNPJ/CPF" hint="Opcional no pré-encaminhamento" error={fieldError("companyDocument")}>
                <Input className="form-input" placeholder="00.000.000/0000-00" {...register("companyDocument")} />
              </FormField>
              <FormField label="Nome do responsável *" error={fieldError("responsibleName")}>
                <Input className="form-input" placeholder="Quem está solicitando" {...register("responsibleName")} />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="WhatsApp *" error={fieldError("whatsapp")}>
                  <Input className="form-input" placeholder="(99) 99999-9999" {...register("whatsapp")} />
                </FormField>
                <FormField label="E-mail" hint="Opcional" error={fieldError("email")}>
                  <Input className="form-input" type="email" placeholder="contato@empresa.com.br" {...register("email")} />
                </FormField>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <FormField label="Nome do colaborador *" error={fieldError("employeeName")}>
                <Input className="form-input" {...register("employeeName")} />
              </FormField>
              <FormField label="CPF do colaborador" hint="Opcional no formulário público" error={fieldError("employeeDocument")}>
                <Input className="form-input" placeholder="000.000.000-00" {...register("employeeDocument")} />
              </FormField>
              <FormField label="Função *" error={fieldError("employeeRole")}>
                <Input className="form-input" placeholder="Cargo ou função exercida" {...register("employeeRole")} />
              </FormField>
              <div>
                <p className="form-label mb-3">Tipo de exame *</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CLINICAL_OPTIONS.map(([value, label]) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition-all",
                        values.clinicalExamType === value
                          ? "border-[var(--brand-green)] bg-[var(--brand-green-light)] shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="radio"
                        value={value}
                        {...register("clinicalExamType")}
                        className="accent-[var(--brand-green)]"
                      />
                      <span className="font-medium text-slate-800">{label}</span>
                    </label>
                  ))}
                </div>
                {fieldError("clinicalExamType") && (
                  <p className="form-error mt-2">{fieldError("clinicalExamType")}</p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="form-label mb-3">Exames complementares</p>
                <div className="space-y-2">
                  {EXAM_MODE_OPTIONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition-all",
                        values.examSelectionMode === value
                          ? "border-[var(--brand-green)] bg-[var(--brand-green-light)]/60"
                          : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="radio"
                        value={value}
                        {...register("examSelectionMode")}
                        className="accent-[var(--brand-green)]"
                      />
                      <span className="text-slate-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {values.examSelectionMode === "SELECIONAR" && (
                <div>
                  <p className="form-label mb-3">Selecione os exames</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PRE_REFERRAL_EXAM_OPTIONS.map((exam) => (
                      <label
                        key={exam}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 text-sm transition",
                          values.selectedExams?.includes(exam)
                            ? "border-[var(--brand-green)] bg-[var(--brand-green-light)]/50"
                            : "border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <Checkbox
                          checked={values.selectedExams?.includes(exam)}
                          onCheckedChange={() => toggleExam(exam)}
                        />
                        {exam}
                      </label>
                    ))}
                  </div>
                  {fieldError("selectedExams") && (
                    <p className="form-error mt-2">{fieldError("selectedExams")}</p>
                  )}
                </div>
              )}

              <FormField label="Observações adicionais" error={fieldError("notes")}>
                <textarea
                  className="form-input min-h-[96px] resize-y"
                  placeholder="Informações úteis para a clínica (opcional)"
                  {...register("notes")}
                />
              </FormField>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <Checkbox
                  checked={values.consentAccepted === true}
                  onCheckedChange={(c) =>
                    setValue("consentAccepted", c ? true : (undefined as never), {
                      shouldValidate: false,
                    })
                  }
                />
                <span className="text-sm leading-relaxed text-slate-600">
                  Declaro que estou autorizado a enviar estas informações e concordo com o contato
                  da clínica para confirmação do atendimento.
                </span>
              </label>
              {fieldError("consentAccepted") && (
                <p className="form-error">{fieldError("consentAccepted")}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="w-full rounded-xl sm:w-auto"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="brand"
            onClick={nextStep}
            className="w-full rounded-xl sm:min-w-[140px] sm:w-auto"
          >
            Próximo <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            variant="brand"
            disabled={loading}
            className="w-full rounded-xl sm:min-w-[220px] sm:w-auto"
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Enviando..." : "Enviar pré-encaminhamento"}
          </Button>
        )}
      </div>
    </form>
  );
}
