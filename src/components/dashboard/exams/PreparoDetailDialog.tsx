"use client";

import type { ExamDetailSerialized } from "@/lib/exams";
import {
  EXAM_CATEGORY_LABELS,
  examNeedsPreparation,
  empresaPreparationBadgeLabel,
} from "@/lib/exams";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type PreparoDetailDialogProps = {
  exam: ExamDetailSerialized | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DetailRow = {
  label: string;
  value: string;
};

function buildRows(exam: ExamDetailSerialized): DetailRow[] {
  const rows: DetailRow[] = [];

  if (exam.preparationBefore?.trim()) {
    rows.push({ label: "Orientação", value: exam.preparationBefore.trim() });
  }
  if (exam.instructionsOnDay?.trim()) {
    rows.push({ label: "No dia do exame", value: exam.instructionsOnDay.trim() });
  }
  if (exam.preparationType === "JEJUM_NECESSARIO") {
    rows.push({ label: "Jejum", value: "Este exame requer jejum." });
  }
  if (exam.whenToNotifyClinic?.trim()) {
    rows.push({ label: "Restrições / informar à clínica", value: exam.whenToNotifyClinic.trim() });
  }
  if (exam.observations?.trim()) {
    rows.push({ label: "Observações", value: exam.observations.trim() });
  }

  return rows;
}

export function PreparoDetailDialog({ exam, open, onOpenChange }: PreparoDetailDialogProps) {
  if (!exam) return null;

  const needsPrep = examNeedsPreparation(exam.preparationType);
  const rows = buildRows(exam);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="preparo-empresa-modal" showCloseButton>
        <header className="preparo-empresa-modal-head">
          <div className="preparo-empresa-modal-head-main">
            <div className="min-w-0">
              <DialogTitle className="preparo-empresa-modal-title">{exam.name}</DialogTitle>
              <DialogDescription className="preparo-empresa-modal-meta">
                {EXAM_CATEGORY_LABELS[exam.category]}
                {exam.shortDescription ? ` · ${exam.shortDescription}` : ""}
              </DialogDescription>
            </div>
            <span
              className={cn(
                "preparos-empresa-badge",
                needsPrep ? "preparos-empresa-badge--needed" : "preparos-empresa-badge--none"
              )}
            >
              {empresaPreparationBadgeLabel(exam.preparationType)}
            </span>
          </div>
        </header>

        <div className="preparo-empresa-modal-body">
          {rows.length === 0 ? (
            <p className="preparo-empresa-modal-empty">
              Não há orientações detalhadas cadastradas para este exame.
            </p>
          ) : (
            <dl className="preparo-empresa-modal-rows">
              {rows.map((row) => (
                <div key={row.label} className="preparo-empresa-modal-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
