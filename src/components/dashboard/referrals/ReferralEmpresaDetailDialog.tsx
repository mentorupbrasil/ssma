"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Paperclip, Stethoscope, LayoutDashboard } from "lucide-react";
import type { ReferralDetailSerialized } from "@/lib/referrals";
import { REFERRAL_DOCUMENT_TYPE_LABELS } from "@/lib/referrals";
import { CLINICAL_EXAM_LABELS, EXAM_CATEGORY_LABELS } from "@/types";
import { empresaReferralDisplayStatus } from "@/lib/empresa-portal";
import { getClinicSiteConfig } from "@/config/clinic";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ReferralEmpresaDetailDialogProps = {
  referral: ReferralDetailSerialized | null;
  open: boolean;
  loading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onRetry?: () => void;
};

type TabId = "resumo" | "exames" | "documentos";

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "resumo", label: "Resumo", icon: LayoutDashboard },
  { id: "exames", label: "Exames solicitados", icon: Stethoscope },
  { id: "documentos", label: "Documentos", icon: Paperclip },
];

function ResumoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="referral-empresa-resumo-field">
      <dt className="colaborador-perfil-field-label">{label}</dt>
      <dd className="colaborador-perfil-field-value">{value}</dd>
    </div>
  );
}

export function ReferralEmpresaDetailDialog({
  referral,
  open,
  loading,
  error,
  onOpenChange,
  onRetry,
}: ReferralEmpresaDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("resumo");

  const handleOpenChange = (next: boolean) => {
    if (!next) setActiveTab("resumo");
    onOpenChange(next);
  };

  const hasDocuments =
    (referral?.documents.length ?? 0) > 0 || (referral?.legacyDocuments.length ?? 0) > 0;

  const display = referral
    ? empresaReferralDisplayStatus(referral.status, referral.scheduledAt)
    : null;

  const clinic = getClinicSiteConfig();
  const locationLabel = clinic.fullAddress || clinic.address || null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="exam-modal referral-empresa-modal" showCloseButton>
        {loading && (
          <div className="referral-empresa-modal-loading">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
          </div>
        )}

        {error && !loading && (
          <div className="referral-error-state py-10">
            <p>{error}</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Tentar novamente
              </Button>
            )}
          </div>
        )}

        {referral && display && !loading && !error && (
          <>
            <header className="referral-empresa-modal-head">
              <div className="referral-empresa-modal-head-top">
                <DialogTitle className="exam-modal-title">{referral.employee.fullName}</DialogTitle>
                <StatusBadge
                  status={display.toneStatus}
                  type="referral"
                  label={display.label}
                />
              </div>
              <DialogDescription className="referral-empresa-modal-subtitle">
                {[
                  referral.employee.jobTitle || null,
                  CLINICAL_EXAM_LABELS[referral.clinicalExamType],
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </DialogDescription>
            </header>

            <div className="dash-module-tabs referral-empresa-modal-tabs colaborador-perfil-tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "dash-module-tab colaborador-perfil-tab",
                      activeTab === tab.id &&
                        "dash-module-tab-active colaborador-perfil-tab--active"
                    )}
                  >
                    <Icon className="mr-1.5 inline h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="referral-empresa-modal-panel">
              {activeTab === "resumo" && (
                <dl className="referral-empresa-resumo-grid">
                  <ResumoField label="Colaborador" value={referral.employee.fullName} />
                  <ResumoField label="Função" value={referral.employee.jobTitle ?? "—"} />
                  <ResumoField label="Setor" value={referral.employee.department ?? "—"} />
                  <ResumoField
                    label="Tipo de exame"
                    value={CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
                  />
                  <ResumoField
                    label="Data da solicitação"
                    value={format(new Date(referral.requestedDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  />
                  <ResumoField label="Responsável" value={referral.authorizerName ?? "—"} />
                  <ResumoField
                    label="Situação do agendamento"
                    value={
                      referral.scheduledAt ? (
                        <div className="referral-empresa-schedule-block">
                          <span>
                            {format(new Date(referral.scheduledAt), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}{" "}
                            ·{" "}
                            {format(new Date(referral.scheduledAt), "HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                          {locationLabel ? (
                            <span className="referral-empresa-schedule-local">
                              Local: {locationLabel}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        "Aguardando definição de data e horário"
                      )
                    }
                  />
                </dl>
              )}

              {activeTab === "exames" && (
                <>
                  {referral.exams.length === 0 ? (
                    <p className="referral-empresa-empty-note">
                      Nenhum exame complementar nesta solicitação.
                    </p>
                  ) : (
                    <ul className="referral-empresa-exam-list">
                      {referral.exams.map((exam) => (
                        <li key={exam.id} className="referral-empresa-exam-item">
                          <div className="referral-empresa-exam-copy">
                            <p className="colaboradores-empresa-name">{exam.examName}</p>
                            <p className="colaboradores-empresa-role">
                              {EXAM_CATEGORY_LABELS[exam.category] ?? exam.category}
                            </p>
                          </div>
                          <StatusBadge status={exam.status} type="exam" />
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {activeTab === "documentos" && (
                <>
                  {!hasDocuments ? (
                    <div className="referral-empresa-docs-empty">
                      <p className="referral-empresa-docs-empty-title">
                        Nenhum documento disponível
                      </p>
                      <p className="referral-empresa-docs-empty-text">
                        Os documentos aparecerão aqui após a liberação pela Unimetra.
                      </p>
                    </div>
                  ) : (
                    <ul className="referral-empresa-doc-list">
                      {referral.documents.map((doc) => (
                        <li key={doc.id} className="referral-empresa-doc-item">
                          <div>
                            <span className="referral-empresa-doc-type">
                              {REFERRAL_DOCUMENT_TYPE_LABELS[doc.type]}
                            </span>
                            <p className="colaboradores-empresa-name">{doc.fileName}</p>
                            <p className="colaboradores-empresa-exam-date">
                              {format(new Date(doc.createdAt), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "rounded-lg"
                              )}
                            >
                              Baixar
                            </a>
                          )}
                        </li>
                      ))}
                      {referral.legacyDocuments.map((doc) => (
                        <li key={doc.id} className="referral-empresa-doc-item">
                          <div>
                            <span className="referral-empresa-doc-type">{doc.type}</span>
                            <p className="colaboradores-empresa-name">{doc.title}</p>
                          </div>
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "rounded-lg"
                              )}
                            >
                              Baixar
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
