"use client";

import { Loader2 } from "lucide-react";
import type { ReferralDetailSerialized } from "@/lib/referrals";
import { REFERRAL_DOCUMENT_TYPE_LABELS, REFERRAL_EXAM_STATUS_LABELS } from "@/lib/referrals";
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
    { key: "aso", label: "ASO", fileUrl: aso?.fileUrl ?? null },
    {
      key: "ficha",
      label: "Ficha clínica",
      fileUrl: fichaDoc?.fileUrl ?? fichaLegacy?.fileUrl ?? null,
    },
  ];

  for (const doc of referral.documents) {
    if (usedIds.has(doc.id)) continue;
    rows.push({
      key: doc.id,
      label: REFERRAL_DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type,
      fileUrl: doc.fileUrl,
    });
  }

  for (const doc of referral.legacyDocuments) {
    if (usedIds.has(doc.id)) continue;
    rows.push({
      key: doc.id,
      label: doc.type,
      fileUrl: doc.fileUrl,
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
  const roleLine = referral
    ? [referral.employee.jobTitle, referral.employee.department].filter(Boolean).join(" · ")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="referral-empresa-modal"
        showCloseButton
      >
        {loading && (
          <div className="referral-empresa-modal-loading">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--brand-green)]" />
          </div>
        )}

        {error && !loading && (
          <div className="referral-error-state py-8">
            <p>{error}</p>
            {onRetry && (
              <Button variant="outline" size="sm" className="rounded-lg" onClick={onRetry}>
                Tentar novamente
              </Button>
            )}
          </div>
        )}

        {referral && display && !loading && !error && (
          <>
            <header className="referral-empresa-modal-head">
              <div className="referral-empresa-modal-head-main">
                <div className="min-w-0">
                  <DialogTitle className="referral-empresa-modal-title">
                    {referral.employee.fullName}
                  </DialogTitle>
                  <DialogDescription className="referral-empresa-modal-meta">
                    {roleLine || "Sem função informada"}
                    {" · "}
                    {CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
                  </DialogDescription>
                </div>
                <StatusBadge
                  status={display.toneStatus}
                  type="referral"
                  label={display.label}
                  className="referral-empresa-modal-status"
                />
              </div>
            </header>

            <div className="referral-empresa-modal-body">
              <section className="referral-empresa-section">
                <h2 className="referral-empresa-section-title">Exames solicitados</h2>
                <div className="referral-empresa-table-wrap">
                  <table className="referral-empresa-table">
                    <thead>
                      <tr>
                        <th>Exame</th>
                        <th>Categoria</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="referral-empresa-table-name" data-label="Exame">
                          {CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
                        </td>
                        <td data-label="Categoria">Exame clínico ocupacional</td>
                        <td data-label="Status">
                          <StatusBadge status="PENDENTE" type="referral" label="Solicitado" />
                        </td>
                      </tr>
                      {referral.exams.map((exam) => (
                        <tr key={exam.id}>
                          <td className="referral-empresa-table-name" data-label="Exame">
                            {exam.examName}
                          </td>
                          <td data-label="Categoria">
                            {EXAM_CATEGORY_LABELS[exam.category] ?? exam.category}
                          </td>
                          <td data-label="Status">
                            <StatusBadge
                              status={exam.status}
                              type="referral"
                              label={REFERRAL_EXAM_STATUS_LABELS[exam.status]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="referral-empresa-section">
                <h2 className="referral-empresa-section-title">Documentos</h2>
                <div className="referral-empresa-table-wrap">
                  <table className="referral-empresa-table">
                    <thead>
                      <tr>
                        <th>Documento</th>
                        <th>Status</th>
                        <th className="referral-empresa-table-actions-col">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentRows.map((doc) => (
                        <tr key={doc.key}>
                          <td className="referral-empresa-table-name" data-label="Documento">
                            {doc.label}
                          </td>
                          <td data-label="Status">
                            {doc.fileUrl ? (
                              <StatusBadge status="DISPONIVEL" type="document" label="Disponível" />
                            ) : (
                              <span className="colaborador-perfil-doc-awaiting">
                                Aguardando liberação
                              </span>
                            )}
                          </td>
                          <td className="referral-empresa-table-actions-col" data-label="Ação">
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
                                  Baixar
                                </a>
                              </div>
                            ) : (
                              <span className="colaboradores-empresa-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
