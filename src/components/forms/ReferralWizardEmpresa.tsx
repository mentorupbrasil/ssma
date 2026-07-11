"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Send, User, Stethoscope } from "lucide-react";

import { submitBulkReferrals } from "@/actions/referrals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CLINICAL_EXAM_LABELS } from "@/types";
import type { ClinicalExamType } from "@prisma/client";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Colaboradores", icon: User },
  { title: "Tipo de exame", icon: Stethoscope },
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
  initialPatientId?: string;
};

export function ReferralWizardEmpresa({
  patients,
  companyName,
  authorizerName,
  initialPatientId,
}: ReferralWizardEmpresaProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialPatientId && patients.some((p) => p.id === initialPatientId) ? [initialPatientId] : []
  );
  const [examByPatient, setExamByPatient] = useState<Record<string, ClinicalExamType>>({});
  const [bulkExam, setBulkExam] = useState<ClinicalExamType | "">("");
  const [submitted, setSubmitted] = useState<{ count: number; protocols: string[] } | null>(null);

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
  const examTypesUsed = [...new Set(selectedIds.map((id) => examByPatient[id]).filter(Boolean))];

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
    toast.success("Tipo de exame aplicado aos selecionados.");
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

    setSubmitted({ count: result.count, protocols: result.protocols });
  };

  if (submitted) {
    return (
      <div className="exames-solicitacao-success">
        <div className="exames-solicitacao-success-icon" aria-hidden>
          <Check className="h-7 w-7" />
        </div>
        <h2 className="colaboradores-empresa-title">Solicitação enviada</h2>
        <p className="exames-solicitacao-success-text">
          {submitted.count === 1
            ? "1 solicitação registrada com sucesso."
            : `${submitted.count} solicitações registradas com sucesso.`}
        </p>
        <div className="exames-solicitacao-protocols">
          <p className="colaborador-perfil-field-label">Protocolo(s)</p>
          <p className="colaborador-perfil-field-value">{submitted.protocols.join(" · ")}</p>
        </div>
        <div className="exames-solicitacao-success-actions">
          <Link href="/dashboard/encaminhamentos">
            <Button variant="brand" size="sm" className="rounded-lg">
              Ver solicitações
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => {
              setSubmitted(null);
              setStep(0);
              setSearch("");
              setSelectedIds(
                initialPatientId && patients.some((p) => p.id === initialPatientId)
                  ? [initialPatientId]
                  : []
              );
              setExamByPatient({});
              setBulkExam("");
            }}
          >
            Nova solicitação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="exames-empresa-wizard">
      <div className="exames-empresa-wizard-steps">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className={cn(
                "exames-empresa-wizard-step",
                i === step && "exames-empresa-wizard-step--active",
                i < step && "exames-empresa-wizard-step--done"
              )}
            >
              <span className="exames-empresa-wizard-step-num">{i + 1}</span>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{s.title}</span>
            </div>
          );
        })}
      </div>

      <div className="exames-empresa-wizard-card">
        <header className="exames-empresa-wizard-card-head">
          <h2 className="colaboradores-empresa-title">{STEPS[step].title}</h2>
          <p className="colaboradores-empresa-subtitle">
            {step === 0 && "Selecione um ou mais colaboradores já cadastrados."}
            {step === 1 && "Defina o tipo de exame para cada colaborador."}
            {step === 2 && "Revise os dados antes de enviar a solicitação."}
          </p>
        </header>

        <div className="exames-empresa-wizard-body">
          {step === 0 && (
            <>
              <div className="exames-empresa-wizard-toolbar">
                <Input
                  placeholder="Buscar por nome, CPF ou função..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="colaboradores-empresa-search-input max-w-md"
                />
                <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={toggleAllVisible}>
                  {filteredPatients.every((p) => selectedIds.includes(p.id)) && filteredPatients.length > 0
                    ? "Desmarcar todos"
                    : "Selecionar todos"}
                </Button>
              </div>
              <div className="exames-empresa-wizard-list">
                {filteredPatients.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">
                    Nenhum colaborador encontrado. Cadastre a equipe antes de solicitar exames.
                  </p>
                ) : (
                  filteredPatients.map((patient) => (
                    <label
                      key={patient.id}
                      className={cn(
                        "exames-empresa-wizard-patient",
                        selectedIds.includes(patient.id) && "exames-empresa-wizard-patient--selected"
                      )}
                    >
                      <Checkbox
                        checked={selectedIds.includes(patient.id)}
                        onCheckedChange={() => togglePatient(patient.id)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="colaboradores-empresa-name">{patient.fullName}</span>
                        <span className="colaboradores-empresa-role block">
                          CPF {patient.cpfMasked}
                          {patient.jobTitle ? ` · ${patient.jobTitle}` : ""}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="colaboradores-empresa-exam-date">{selectedIds.length} colaborador(es) selecionado(s)</p>
            </>
          )}

          {step === 1 && (
            <>
              <div className="exames-empresa-wizard-bulk">
                <select
                  value={bulkExam}
                  onChange={(e) => setBulkExam(e.target.value as ClinicalExamType | "")}
                  className="colaboradores-empresa-select flex-1"
                >
                  <option value="">Aplicar tipo a todos</option>
                  {CLINICAL_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="brand" size="sm" className="rounded-lg" onClick={applyBulkExam} disabled={!bulkExam}>
                  Aplicar
                </Button>
              </div>
              <div className="exames-empresa-wizard-exam-rows">
                {selectedPatients.map((patient) => (
                  <div key={patient.id} className="exames-empresa-wizard-exam-row">
                    <div>
                      <p className="colaboradores-empresa-name">{patient.fullName}</p>
                      <p className="colaboradores-empresa-role">{patient.jobTitle ?? "Sem função informada"}</p>
                    </div>
                    <select
                      value={examByPatient[patient.id] ?? ""}
                      onChange={(e) =>
                        setExamByPatient((prev) => ({
                          ...prev,
                          [patient.id]: e.target.value as ClinicalExamType,
                        }))
                      }
                      className="colaboradores-empresa-select"
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
            <div className="exames-empresa-wizard-review">
              <div className="colaborador-perfil-grid colaborador-perfil-grid--3">
                <div className="colaborador-perfil-highlight">
                  <span className="colaborador-perfil-highlight-label">Empresa</span>
                  <span className="colaborador-perfil-highlight-value">{companyName}</span>
                </div>
                <div className="colaborador-perfil-highlight">
                  <span className="colaborador-perfil-highlight-label">Colaboradores</span>
                  <span className="colaborador-perfil-highlight-value">{selectedIds.length}</span>
                </div>
                <div className="colaborador-perfil-highlight">
                  <span className="colaborador-perfil-highlight-label">Tipos de exame</span>
                  <span className="colaborador-perfil-highlight-value">
                    {examTypesUsed.length === 1
                      ? CLINICAL_EXAM_LABELS[examTypesUsed[0]]
                      : `${examTypesUsed.length} tipos`}
                  </span>
                </div>
              </div>

              <div className="colaboradores-empresa-table-wrap">
                <div className="colaboradores-empresa-table-scroll">
                  <table className="colaboradores-empresa-table">
                    <thead>
                      <tr>
                        <th>Colaborador</th>
                        <th>Tipo de exame</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPatients.map((patient) => (
                        <tr key={patient.id} className="colaboradores-empresa-row">
                          <td className="colaboradores-empresa-name">{patient.fullName}</td>
                          <td>{CLINICAL_EXAM_LABELS[examByPatient[patient.id]]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="referral-empresa-modal-guidance">
                A clínica processará a solicitação e atualizará o status em Exames. Você será avisado quando o documento estiver disponível.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="exames-empresa-wizard-actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
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
            size="sm"
            className="rounded-lg"
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
            size="sm"
            className="rounded-lg"
            disabled={loading || !canGoNext()}
            onClick={handleSubmit}
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Enviando..." : "Enviar solicitação"}
          </Button>
        )}
      </div>
    </div>
  );
}
