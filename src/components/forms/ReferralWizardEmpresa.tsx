"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Send, User, Stethoscope } from "lucide-react";

import { submitBulkReferrals } from "@/actions/referrals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINICAL_EXAM_LABELS } from "@/types";
import type { ClinicalExamType } from "@prisma/client";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Colaboradores", icon: User },
  { title: "Exames", icon: Stethoscope },
  { title: "Revisão", icon: Check },
] as const;

const CLINICAL_OPTIONS = Object.entries(CLINICAL_EXAM_LABELS) as [ClinicalExamType, string][];

export type EmpresaReferralPatient = {
  id: string;
  fullName: string;
  cpfMasked: string;
  jobTitle: string | null;
  department: string | null;
};

type ReferralWizardEmpresaProps = {
  patients: EmpresaReferralPatient[];
  companyName: string;
  authorizerName: string;
};

export function ReferralWizardEmpresa({
  patients,
  companyName,
  authorizerName,
}: ReferralWizardEmpresaProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [examByPatient, setExamByPatient] = useState<Record<string, ClinicalExamType>>({});
  const [bulkExam, setBulkExam] = useState<ClinicalExamType | "">("");

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.cpfMasked.includes(q) ||
        (p.jobTitle?.toLowerCase().includes(q) ?? false)
    );
  }, [patients, search]);

  const selectedPatients = patients.filter((p) => selectedIds.includes(p.id));

  const togglePatient = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAllVisible = () => {
    const visibleIds = filteredPatients.map((p) => p.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const applyBulkExam = () => {
    if (!bulkExam) return;
    const next = { ...examByPatient };
    selectedIds.forEach((id) => {
      next[id] = bulkExam;
    });
    setExamByPatient(next);
    toast.success("Tipo de exame aplicado em massa.");
  };

  const canGoNext = () => {
    if (step === 0) return selectedIds.length > 0;
    if (step === 1) return selectedIds.every((id) => examByPatient[id]);
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const entries = selectedIds.map((patientId) => ({
      patientId,
      clinicalExamType: examByPatient[patientId],
    }));
    const result = await submitBulkReferrals({
      authorizerName,
      entries,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`${result.count} encaminhamento(s) enviado(s) com sucesso.`);
    router.push("/dashboard/encaminhamentos");
    router.refresh();
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">
            Etapa {step + 1} de {STEPS.length}
          </span>
          <span className="font-semibold text-[var(--brand-green)]">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--brand-green)] to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium",
                  i === step && "bg-[var(--brand-navy)] text-white",
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
            {step === 0 && "Selecione um ou mais colaboradores já cadastrados."}
            {step === 1 && "Defina o tipo de exame para cada colaborador ou aplique em massa."}
            {step === 2 && "Confira os dados antes de enviar para a clínica."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {step === 0 && (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                  placeholder="Buscar por nome, CPF ou função..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-md"
                />
                <Button type="button" variant="outline" className="rounded-xl" onClick={toggleAllVisible}>
                  {filteredPatients.every((p) => selectedIds.includes(p.id)) && filteredPatients.length > 0
                    ? "Desmarcar visíveis"
                    : "Selecionar visíveis"}
                </Button>
              </div>
              <div className="max-h-[22rem] space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {filteredPatients.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">
                    Nenhum colaborador encontrado. Cadastre a equipe antes de encaminhar.
                  </p>
                ) : (
                  filteredPatients.map((patient) => (
                    <label
                      key={patient.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                        selectedIds.includes(patient.id)
                          ? "border-[var(--brand-green)] bg-[var(--brand-green-light)]/40"
                          : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Checkbox
                        checked={selectedIds.includes(patient.id)}
                        onCheckedChange={() => togglePatient(patient.id)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--brand-navy)]">
                          {patient.fullName}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          CPF {patient.cpfMasked}
                          {patient.jobTitle ? ` · ${patient.jobTitle}` : ""}
                          {patient.department ? ` · ${patient.department}` : ""}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500">{selectedIds.length} colaborador(es) selecionado(s)</p>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Aplicar em massa
                  </p>
                  <select
                    value={bulkExam}
                    onChange={(e) => setBulkExam(e.target.value as ClinicalExamType | "")}
                    className="form-select w-full"
                  >
                    <option value="">Selecione o tipo de exame</option>
                    {CLINICAL_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="button" variant="brand" className="rounded-xl" onClick={applyBulkExam} disabled={!bulkExam}>
                  Aplicar aos selecionados
                </Button>
              </div>

              <div className="space-y-2">
                {selectedPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_14rem]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--brand-navy)]">{patient.fullName}</p>
                      <p className="text-xs text-slate-500">{patient.jobTitle ?? "Sem função informada"}</p>
                    </div>
                    <select
                      value={examByPatient[patient.id] ?? ""}
                      onChange={(e) =>
                        setExamByPatient((prev) => ({
                          ...prev,
                          [patient.id]: e.target.value as ClinicalExamType,
                        }))
                      }
                      className="form-select"
                    >
                      <option value="">Tipo de exame *</option>
                      {CLINICAL_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
                <p>
                  <span className="font-semibold text-[var(--brand-navy)]">Empresa:</span> {companyName}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-[var(--brand-navy)]">Responsável:</span> {authorizerName}
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Exame</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPatients.map((patient) => (
                      <tr key={patient.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-[var(--brand-navy)]">{patient.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {CLINICAL_EXAM_LABELS[examByPatient[patient.id]]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">
                A Unimetra definirá os exames complementares e laboratoriais conforme o PCMSO da empresa.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={step === 0 || loading}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="brand"
            className="rounded-xl"
            disabled={!canGoNext()}
            onClick={() => setStep((s) => s + 1)}
          >
            Próximo
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="brand"
            className="rounded-xl"
            disabled={loading || !canGoNext()}
            onClick={handleSubmit}
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Enviando..." : "Confirmar encaminhamento"}
          </Button>
        )}
      </div>
    </div>
  );
}
