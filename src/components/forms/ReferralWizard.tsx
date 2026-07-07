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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

const STEPS = [
  { title: "Empresa", schema: referralStep1Schema },
  { title: "Colaborador", schema: referralStep2Schema },
  { title: "Exame clínico", schema: referralStep3Schema },
  { title: "Complementares", schema: referralStep4Schema },
  { title: "Laboratoriais", schema: referralStep5Schema },
  { title: "Revisão", schema: referralStep6Schema },
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${
              i === step
                ? "bg-[#0F3D4A] text-white"
                : i < step
                  ? "bg-[#DFF7F0] text-[#0F3D4A]"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {i + 1}. {s.title}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0F3D4A]">{STEPS[step].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div><Label>Nome da empresa</Label><Input {...register("companyName")} />{errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}</div>
              <div><Label>CNPJ/CPF</Label><Input {...register("companyDocument")} placeholder="00.000.000/0000-00" />{errors.companyDocument && <p className="text-sm text-red-500">{errors.companyDocument.message}</p>}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Telefone</Label><Input {...register("companyPhone")} />{errors.companyPhone && <p className="text-sm text-red-500">{errors.companyPhone.message}</p>}</div>
                <div><Label>E-mail</Label><Input type="email" {...register("companyEmail")} />{errors.companyEmail && <p className="text-sm text-red-500">{errors.companyEmail.message}</p>}</div>
              </div>
              <div><Label>Responsável autorizador</Label><Input {...register("authorizerName")} />{errors.authorizerName && <p className="text-sm text-red-500">{errors.authorizerName.message}</p>}</div>
            </>
          )}

          {step === 1 && (
            <>
              <div><Label>Nome completo</Label><Input {...register("patientName")} />{errors.patientName && <p className="text-sm text-red-500">{errors.patientName.message}</p>}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>CPF</Label><Input {...register("patientCpf")} />{errors.patientCpf && <p className="text-sm text-red-500">{errors.patientCpf.message}</p>}</div>
                <div><Label>RG</Label><Input {...register("patientRg")} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Data de nascimento</Label><Input type="date" {...register("birthDate")} />{errors.birthDate && <p className="text-sm text-red-500">{errors.birthDate.message}</p>}</div>
                <div>
                  <Label>Sexo</Label>
                  <select {...register("gender")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">Selecione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                  {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Função</Label><Input {...register("jobTitle")} />{errors.jobTitle && <p className="text-sm text-red-500">{errors.jobTitle.message}</p>}</div>
                <div><Label>Setor</Label><Input {...register("department")} />{errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}</div>
              </div>
              <div><Label>Telefone (opcional)</Label><Input {...register("patientPhone")} /></div>
            </>
          )}

          {step === 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {CLINICAL_OPTIONS.map(([value, label]) => (
                <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${values.clinicalExamType === value ? "border-[#16A085] bg-[#DFF7F0]" : "border-slate-200"}`}>
                  <input type="radio" value={value} {...register("clinicalExamType")} className="accent-[#16A085]" />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
              {errors.clinicalExamType && <p className="text-sm text-red-500">{errors.clinicalExamType.message}</p>}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {COMPLEMENTARY_EXAM_OPTIONS.map((exam) => (
                <label key={exam} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm">
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
                <label key={exam} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm">
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
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-slate-50 p-4 space-y-2">
                <p><strong>Empresa:</strong> {values.companyName}</p>
                <p><strong>Colaborador:</strong> {values.patientName}</p>
                <p><strong>Exame clínico:</strong> {CLINICAL_EXAM_LABELS[values.clinicalExamType]}</p>
                <p><strong>Complementares:</strong> {values.complementaryExams?.length ? values.complementaryExams.join(", ") : "Nenhum"}</p>
                <p><strong>Laboratoriais:</strong> {values.labExams?.length ? values.labExams.join(", ") : "Nenhum"}</p>
              </div>
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={values.consent === true}
                  onCheckedChange={(c) => setValue("consent", c ? true : undefined as never)}
                />
                <span className="text-slate-600">
                  Declaro estar ciente sobre o uso dos dados pessoais conforme a{" "}
                  <a href="/politica-de-privacidade" className="text-[#16A085] underline" target="_blank">
                    Política de Privacidade
                  </a>
                  .
                </span>
              </label>
              {errors.consent && <p className="text-sm text-red-500">{errors.consent.message}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={nextStep} className="bg-[#16A085] hover:bg-[#138d75]">
            Próximo <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={loading} className="bg-[#16A085] hover:bg-[#138d75]">
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Enviando..." : "Enviar encaminhamento"}
          </Button>
        )}
      </div>
    </form>
  );
}
