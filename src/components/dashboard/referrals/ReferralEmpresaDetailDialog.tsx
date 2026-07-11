"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import type { ReferralDetailSerialized } from "@/lib/referrals";
import { REFERRAL_DOCUMENT_TYPE_LABELS } from "@/lib/referrals";
import { CLINICAL_EXAM_LABELS, EXAM_CATEGORY_LABELS } from "@/types";
import { empresaReferralDisplayStatus } from "@/lib/empresa-portal";
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

type DocRow = {
  key: string;
  label: string;
  fileUrl: string | null;
  fileName?: string | null;
};

function buildDocumentRows(referral: ReferralDetailSerialized): DocRow[] {
  const aso = referral.documents.find((d) => d.type === "ASO") ?? null;
  const fichaDoc =
    referral.documents.find(
      (d) => d.type === "GUIA" || d.fileName.toLowerCase().includes("ficha")
    ) ?? null;
  const fichaLegacy =
    referral.legacyDocuments.find((d) => d.title.toLowerCase().includes("ficha")) ?? null;

  const usedIds = new Set<string>();
  if (aso) usedIds.add(aso.id);
  if (fichaDoc) usedIds.add(fichaDoc.id);
  if (fichaLegacy) usedIds.add(fichaLegacy.id);

  const rows: DocRow[] = [
    {
      key: "aso",
      label: "ASO",
      fileUrl: aso?.fileUrl ?? null,
      fileName: aso?.fileName ?? null,
    },
    {
      key: "ficha",
      label: "Ficha clínica",
      fileUrl: fichaDoc?.fileUrl ?? fichaLegacy?.fileUrl ?? null,
      fileName: fichaDoc?.fileName ?? fichaLegacy?.title ?? null,
    },
  ];

  for (const doc of referral.documents) {
    if (usedIds.has(doc.id)) continue;
    rows.push({
      key: doc.id,
      label: REFERRAL_DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
    });
  }

  for (const doc of referral.legacyDocuments) {
    if (usedIds.has(doc.id)) continue;
    rows.push({
      key: doc.id,
      label: doc.type,
      fileUrl: doc.fileUrl,
      fileName: doc.title,
    });
  }

  return rows;
}

export function ReferralEmpresaDetailDialog({
  referral,
  open,
  loading,
  error,
  onOpenChange,
  onRetry,
}: ReferralEmpresaDetailDialogProps) {
  const display = referral
    ? empresaReferralDisplayStatus(referral.status, referral.scheduledAt)
    : null;

  const documentRows = referral ? buildDocumentRows(referral) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="exam-modal referral-empresa-modal referral-empresa-modal--compact" showCloseButton>
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
                {CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
                {referral.scheduledAt
                  ? ` · ${format(new Date(referral.scheduledAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`
                  : ""}
              </DialogDescription>
            </header>

            <div className="referral-empresa-modal-body">
              <section className="referral-empresa-section">
                <h2 className="referral-empresa-section-title">Exames solicitados</h2>
                <ul className="referral-empresa-exam-list">
                  <li className="referral-empresa-exam-item">
                    <div className="referral-empresa-exam-copy">
                      <p className="colaboradores-empresa-name">
                        {CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
                      </p>
                      <p className="colaboradores-empresa-role">Exame clínico ocupacional</p>
                    </div>
                    <StatusBadge
                      status={display.toneStatus}
                      type="referral"
                      label={display.label}
                    />
                  </li>
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
              </section>

              <section className="referral-empresa-section">
                <h2 className="referral-empresa-section-title">Documentos</h2>
                <ul className="referral-empresa-doc-list">
                  {documentRows.map((doc) => (
                    <li key={doc.key} className="referral-empresa-doc-item">
                      <div className="min-w-0">
                        <p className="colaboradores-empresa-name">{doc.label}</p>
                        {doc.fileName ? (
                          <p className="colaboradores-empresa-exam-date truncate">{doc.fileName}</p>
                        ) : null}
                      </div>
                      {doc.fileUrl ? (
                        <div className="referral-empresa-doc-actions">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "rounded-lg"
                            )}
                          >
                            Visualizar
                          </a>
                          <a
                            href={doc.fileUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({ variant: "brand", size: "sm" }),
                              "rounded-lg"
                            )}
                          >
                            Baixar PDF
                          </a>
                        </div>
                      ) : (
                        <span className="colaborador-perfil-doc-awaiting">Aguardando liberação</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
