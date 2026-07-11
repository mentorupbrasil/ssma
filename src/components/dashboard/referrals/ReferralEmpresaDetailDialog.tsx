"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Loader2, Paperclip, Stethoscope, User } from "lucide-react";
import type { ReferralDetailSerialized } from "@/lib/referrals";
import {
  REFERRAL_DOCUMENT_TYPE_LABELS,
  REFERRAL_EXAM_STATUS_LABELS,
  maskCpf,
} from "@/lib/referrals";
import { CLINICAL_EXAM_LABELS, EXAM_CATEGORY_LABELS } from "@/types";
import { empresaReferralStatusLabel } from "@/lib/empresa-portal";
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

type TabId = "geral" | "exames" | "documentos";

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "geral", label: "Geral", icon: User },
  { id: "exames", label: "Exames", icon: Stethoscope },
  { id: "documentos", label: "Documentos", icon: Paperclip },
];

function ModalField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="exam-modal-item">
      <p className="exam-modal-item-label">{label}</p>
      <div className="exam-modal-item-text">{value}</div>
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
  const [activeTab, setActiveTab] = useState<TabId>("geral");

  const handleOpenChange = (next: boolean) => {
    if (!next) setActiveTab("geral");
    onOpenChange(next);
  };

  const asoDoc = referral?.documents.find((d) => d.type === "ASO");

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
            <header className="exam-modal-head">
              <div className="exam-modal-head-top">
                <div className="exam-drawer-badges">
                  <span className="exam-drawer-badge exam-drawer-badge--category">
                    {CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
                  </span>
                  <StatusBadge
                    status={referral.status}
                    type="referral"
                    label={empresaReferralStatusLabel(referral.status)}
                  />
                </div>
              </div>
              <DialogTitle className="exam-modal-title">{referral.employee.fullName}</DialogTitle>
              <DialogDescription className="collaborator-modal-subtitle">
                Solicitado em{" "}
                {format(new Date(referral.requestedDate), "dd/MM/yyyy", { locale: ptBR })}
                {referral.employee.jobTitle ? ` · ${referral.employee.jobTitle}` : ""}
              </DialogDescription>
            </header>

            <div className="dash-module-tabs referral-empresa-modal-tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "dash-module-tab",
                      activeTab === tab.id && "dash-module-tab-active"
                    )}
                  >
                    <Icon className="mr-1.5 inline h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "geral" && (
              <div className="exam-modal-grid referral-empresa-modal-grid">
                <ModalField label="Colaborador" value={referral.employee.fullName} />
                <ModalField label="CPF" value={maskCpf(referral.employee.cpf)} />
                <ModalField label="Função" value={referral.employee.jobTitle ?? "—"} />
                <ModalField label="Setor" value={referral.employee.department ?? "—"} />
                <ModalField
                  label="Tipo de exame"
                  value={CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
                />
                <ModalField
                  label="Data da solicitação"
                  value={format(new Date(referral.requestedDate), "dd/MM/yyyy", { locale: ptBR })}
                />
                {(referral.employee.notes || referral.internalNotes) && (
                  <div className="exam-modal-item exam-modal-item--wide">
                    <p className="exam-modal-item-label">Observações</p>
                    <p className="exam-modal-item-text">
                      {referral.employee.notes ?? referral.internalNotes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "exames" && (
              <div className="referral-empresa-modal-panel">
                {referral.exams.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum exame complementar neste encaminhamento.</p>
                ) : (
                  <ul className="space-y-2">
                    {referral.exams.map((exam) => (
                      <li key={exam.id} className="referral-exam-item">
                        <div>
                          <span className="text-xs text-slate-500">
                            {EXAM_CATEGORY_LABELS[exam.category] ?? exam.category}
                          </span>
                          <p className="font-medium text-slate-800">{exam.examName}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {REFERRAL_EXAM_STATUS_LABELS[exam.status]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === "documentos" && (
              <div className="referral-empresa-modal-panel">
                {referral.documents.length === 0 && referral.legacyDocuments.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    A clínica ainda não anexou documentos. Quando o ASO estiver pronto, ele aparecerá
                    aqui e em ASOs e documentos.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {referral.documents.map((doc) => (
                      <li key={doc.id} className="referral-doc-item">
                        <div>
                          <span className="text-xs font-medium text-[var(--brand-green)]">
                            {REFERRAL_DOCUMENT_TYPE_LABELS[doc.type]}
                          </span>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          {doc.uploadedByName && (
                            <p className="text-xs text-slate-500">
                              {format(new Date(doc.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Baixar
                          </a>
                        </div>
                      </li>
                    ))}
                    {referral.legacyDocuments.map((doc) => (
                      <li key={doc.id} className="referral-doc-item">
                        <div>
                          <span className="text-xs text-slate-500">{doc.type}</span>
                          <p className="text-sm font-medium">{doc.title}</p>
                        </div>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Baixar
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="exam-modal-notice">
              O colaborador comparece à clínica quando puder. A Unimetra anexa o ASO quando o exame
              for concluído.
            </p>

            <footer className="exam-modal-footer referral-empresa-modal-footer">
              {asoDoc?.fileUrl ? (
                <a
                  href={asoDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "brand", size: "sm" }), "rounded-xl")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Baixar ASO
                </a>
              ) : (
                <Link
                  href="/dashboard/documentos"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
                >
                  Ver ASOs e documentos
                </Link>
              )}
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
