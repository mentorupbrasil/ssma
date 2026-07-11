"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Loader2, Paperclip, Stethoscope, LayoutDashboard } from "lucide-react";
import type { ReferralDetailSerialized } from "@/lib/referrals";
import { REFERRAL_DOCUMENT_TYPE_LABELS } from "@/lib/referrals";
import { CLINICAL_EXAM_LABELS, EXAM_CATEGORY_LABELS } from "@/types";
import {
  empresaReferralStatusLabel,
  empresaReferralStatusGuidance,
} from "@/lib/empresa-portal";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/dashboard/EmptyState";

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
    <div>
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

  const asoDoc = referral?.documents.find((d) => d.type === "ASO");
  const hasDocuments =
    (referral?.documents.length ?? 0) > 0 || (referral?.legacyDocuments.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="exam-modal referral-empresa-modal" showCloseButton>
        {loading && (
          <div className="flex justify-center py-16">
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

        {referral && !loading && !error && (
          <>
            <header className="referral-empresa-modal-head">
              <div className="referral-empresa-modal-head-top">
                <span className="referral-empresa-modal-protocol">{referral.protocol}</span>
                <StatusBadge
                  status={referral.status}
                  type="referral"
                  label={empresaReferralStatusLabel(referral.status)}
                />
              </div>
              <DialogTitle className="exam-modal-title">{referral.employee.fullName}</DialogTitle>
              <DialogDescription className="referral-empresa-modal-subtitle">
                {CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
                {referral.employee.jobTitle ? ` · ${referral.employee.jobTitle}` : ""}
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
                      activeTab === tab.id && "dash-module-tab-active colaborador-perfil-tab--active"
                    )}
                  >
                    <Icon className="mr-1.5 inline h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "resumo" && (
              <div className="referral-empresa-modal-panel">
                <section className="colaborador-perfil-block">
                  <h2 className="colaborador-perfil-block-title">Dados do colaborador</h2>
                  <dl className="colaborador-perfil-fields">
                    <ResumoField label="Colaborador" value={referral.employee.fullName} />
                    <ResumoField label="Função" value={referral.employee.jobTitle ?? "—"} />
                    <ResumoField label="Setor" value={referral.employee.department ?? "—"} />
                  </dl>
                </section>

                <section className="colaborador-perfil-block">
                  <h2 className="colaborador-perfil-block-title">Solicitação</h2>
                  <dl className="colaborador-perfil-fields">
                    <ResumoField
                      label="Tipo de exame"
                      value={CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
                    />
                    <ResumoField
                      label="Data da solicitação"
                      value={format(new Date(referral.requestedDate), "dd/MM/yyyy", { locale: ptBR })}
                    />
                    <ResumoField label="Responsável" value={referral.authorizerName ?? "—"} />
                  </dl>
                </section>

                <section className="colaborador-perfil-block">
                  <h2 className="colaborador-perfil-block-title">Agendamento</h2>
                  <dl className="colaborador-perfil-fields">
                    <ResumoField
                      label="Data e horário"
                      value={
                        referral.scheduledAt
                          ? format(new Date(referral.scheduledAt), "dd/MM/yyyy · HH:mm", {
                              locale: ptBR,
                            })
                          : "Ainda não agendado"
                      }
                    />
                    <ResumoField
                      label="Situação"
                      value={
                        <StatusBadge
                          status={referral.status}
                          type="referral"
                          label={empresaReferralStatusLabel(referral.status)}
                        />
                      }
                    />
                  </dl>
                  <p className="referral-empresa-modal-guidance">
                    {empresaReferralStatusGuidance(referral.status, referral.scheduledAt)}
                  </p>
                </section>
              </div>
            )}

            {activeTab === "exames" && (
              <div className="referral-empresa-modal-panel">
                {referral.exams.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum exame complementar nesta solicitação.</p>
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
              </div>
            )}

            {activeTab === "documentos" && (
              <div className="referral-empresa-modal-panel">
                {!hasDocuments ? (
                  <>
                    <EmptyState
                      compact
                      className="colaboradores-empresa-empty"
                      title="Nenhum documento disponível"
                      description="Quando a clínica liberar o ASO ou outros documentos, eles aparecerão aqui para download."
                    />
                    <footer className="referral-empresa-modal-footer">
                      <Link
                        href="/dashboard/documentos"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
                      >
                        Ver ASOs e documentos
                      </Link>
                    </footer>
                  </>
                ) : (
                  <>
                    <ul className="referral-empresa-doc-list">
                      {referral.documents.map((doc) => (
                        <li key={doc.id} className="referral-empresa-doc-item">
                          <div>
                            <span className="referral-empresa-doc-type">
                              {REFERRAL_DOCUMENT_TYPE_LABELS[doc.type]}
                            </span>
                            <p className="colaboradores-empresa-name">{doc.fileName}</p>
                            <p className="colaboradores-empresa-exam-date">
                              {format(new Date(doc.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
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
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
                            >
                              Baixar
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                    <footer className="referral-empresa-modal-footer">
                      {asoDoc?.fileUrl ? (
                        <a
                          href={asoDoc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(buttonVariants({ variant: "brand", size: "sm" }), "rounded-lg")}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Baixar ASO
                        </a>
                      ) : (
                        <Link
                          href="/dashboard/documentos"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
                        >
                          Ver ASOs e documentos
                        </Link>
                      )}
                    </footer>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
