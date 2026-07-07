"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  referralStep1Schema,
  referralStep2Schema,
  referralStep3Schema,
  referralStep4Schema,
  referralStep5Schema,
  referralStep6Schema,
  type ReferralFormData,
} from "@/schemas";
import { COMPLEMENTARY_EXAM_OPTIONS, LAB_EXAM_OPTIONS } from "@/data/services";
import { submitReferral } from "@/actions";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { ChevronLeft, ChevronRight, Send, Check, Building2, User, Stethoscope, FlaskConical, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Empresa", icon: Building2, schema: referralStep1Schema },
  { title: "Colaborador", icon: User, schema: referralStep2Schema },
  { title: "Exame clínico", icon: Stethoscope, schema: referralStep3Schema },
  { title: "Complementares", icon: FileCheck, schema: referralStep4Schema },
  { title: "Laboratoriais", icon: FlaskConical, schema: referralStep5Schema },
  { title: "Revisão", icon: Check, schema: referralStep6Schema },
];

const CLINICAL_OPTIONS = Object.entries(CLINICAL_EXAM_LABELS);

export function ReferralWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(
      referralStep1Schema
        .merge(referralStep2Schema)
        .merge(referralStep3Schema)
        .merge(referralStep4Schema)
        .merge(referralStep5Schema)
        .merge(referralStep6Schema)
    ),
    defaultValues: {
      complementaryExams: [],
      labExams: [],
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const values = watch();
  const progress = ((step + 1) / STEPS.length) * 100;

  const nextStep = async () => {
    const currentSchema = STEPS[step].schema;
    const fields = Object.keys(currentSchema.shape) as (keyof ReferralFormData)[];
    const valid = await form.trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async (data: ReferralFormData) => {
    setLoading(true);
    const result = await submitReferral(data);
    setLoading(false);

    if (result.success) {
      toast.success("Encaminhamento enviado com sucesso!");
      router.push(`/encaminhamento-online/sucesso?protocolo=${result.protocol}`);
    } else {
      toast.error(result.error);
    }
  };

  const toggleArray = (field: "complementaryExams" | "labExams", value: string) => {
    const current = values[field] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(field, next);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">
            Etapa {step + 1} de {STEPS.length}
          </span>
          <span className="font-semibold text-[var(--brand-green)]">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--brand-green)] to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="hidden gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
                  i === step && "bg-[var(--brand-navy)] text-white shadow-sm",
                  i < step && "bg-[var(--brand-green-light)] text-[var(--brand-navy)]",
                  i > step && "bg-slate-100 text-slate-500"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="premium-card overflow-hidden border-slate-200/80 shadow-[var(--shadow-card)]">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-xl text-[var(--brand-navy)]">{STEPS[step].title}</CardTitle>
          <CardDescription>
            Preencha os dados com atenção. Campos obrigatórios estão marcados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {step === 0 && (
            <>
              <FormField label="Nome da empresa" error={errors.companyName?.message}>
                <Input className="form-input" {...register("companyName")} />
              </FormField>
              <FormField label="CNPJ/CPF" error={errors.companyDocument?.message}>
                <Input className="form-input" placeholder="00.000.000/0000-00" {...register("companyDocument")} />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Telefone" error={errors.companyPhone?.message}>
                  <Input className="form-input" {...register("companyPhone")} />
                </FormField>
                <FormField label="E-mail" error={errors.companyEmail?.message}>
                  <Input className="form-input" type="email" {...register("companyEmail")} />
                </FormField>
              </div>
              <FormField label="Responsável autorizador" error={errors.authorizerName?.message}>
                <Input className="form-input" {...register("authorizerName")} />
              </FormField>
            </>
          )}

          {step === 1 && (
            <>
              <FormField label="Nome completo" error={errors.patientName?.message}>
                <Input className="form-input" {...register("patientName")} />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="CPF" error={errors.patientCpf?.message}>
                  <Input className="form-input" {...register("patientCpf")} />
                </FormField>
                <FormField label="RG">
                  <Input className="form-input" {...register("patientRg")} />
                </FormField>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Data de nascimento" error={errors.birthDate?.message}>
                  <Input className="form-input" type="date" {...register("birthDate")} />
                </FormField>
                <FormField label="Sexo" error={errors.gender?.message}>
                  <select {...register("gender")} className="form-select">
                    <option value="">Selecione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </FormField>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Função" error={errors.jobTitle?.message}>
                  <Input className="form-input" {...register("jobTitle")} />
                </FormField>
                <FormField label="Setor" error={errors.department?.message}>
                  <Input className="form-input" {...register("department")} />
                </FormField>
              </div>
              <FormField label="Telefone (opcional)">
                <Input className="form-input" {...register("patientPhone")} />
              </FormField>
            </>
          )}

          {step === 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {CLINICAL_OPTIONS.map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all",
                    values.clinicalExamType === value
                      ? "border-[var(--brand-green)] bg-[var(--brand-green-light)] shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <input type="radio" value={value} {...register("clinicalExamType")} className="accent-[var(--brand-green)]" />
                  <span className="text-sm font-medium text-slate-800">{label}</span>
                </label>
              ))}
              {errors.clinicalExamType && <p className="form-error sm:col-span-2">{errors.clinicalExamType.message}</p>}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {COMPLEMENTARY_EXAM_OPTIONS.map((exam) => (
                <label
                  key={exam}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3.5 text-sm transition",
                    values.complementaryExams?.includes(exam)
                      ? "border-[var(--brand-green)] bg-[var(--brand-green-light)]/50"
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Checkbox
                    checked={values.complementaryExams?.includes(exam)}
                    onCheckedChange={() => toggleArray("complementaryExams", exam)}
                  />
                  {exam}
                </label>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {LAB_EXAM_OPTIONS.map((exam) => (
                <label
                  key={exam}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3.5 text-sm transition",
                    values.labExams?.includes(exam)
                      ? "border-[var(--brand-green)] bg-[var(--brand-green-light)]/50"
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Checkbox
                    checked={values.labExams?.includes(exam)}
                    onCheckedChange={() => toggleArray("labExams", exam)}
                  />
                  {exam}
                </label>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-sm">
                <p><span className="font-semibold text-slate-700">Empresa:</span> {values.companyName}</p>
                <p><span className="font-semibold text-slate-700">Colaborador:</span> {values.patientName}</p>
                <p><span className="font-semibold text-slate-700">Exame clínico:</span> {CLINICAL_EXAM_LABELS[values.clinicalExamType]}</p>
                <p><span className="font-semibold text-slate-700">Complementares:</span> {values.complementaryExams?.length ? values.complementaryExams.join(", ") : "Nenhum"}</p>
                <p><span className="font-semibold text-slate-700">Laboratoriais:</span> {values.labExams?.length ? values.labExams.join(", ") : "Nenhum"}</p>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <Checkbox
                  checked={values.consent === true}
                  onCheckedChange={(c) => setValue("consent", c ? true : undefined as never)}
                />
                <span className="text-sm leading-relaxed text-slate-600">
                  Declaro estar ciente sobre o uso dos dados pessoais conforme a{" "}
                  <a href="/politica-de-privacidade" className="font-medium text-[var(--brand-green)] underline" target="_blank">
                    Política de Privacidade
                  </a>
                  .
                </span>
              </label>
              {errors.consent && <p className="form-error">{errors.consent.message}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="rounded-xl"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" variant="brand" onClick={nextStep} className="rounded-xl sm:min-w-[140px]">
            Próximo <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" variant="brand" disabled={loading} className="rounded-xl sm:min-w-[220px]">
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Enviando..." : "Enviar encaminhamento"}
          </Button>
        )}
      </div>
    </form>
  );
}
