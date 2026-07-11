"use client";

import type { ExamGuide } from "@/data/exams";
import {
  copyExamInstructions,
  DISPLAY_CATEGORY_LABELS,
  PREPARATION_STATUS_LABELS,
} from "@/lib/exam-preparation";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type ExamPreparationDrawerProps = {
  exam: ExamGuide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PrepItem = {
  label: string;
  text: string;
  wide?: boolean;
};

function buildPrepItems(exam: ExamGuide): PrepItem[] {
  const items: PrepItem[] = [
    { label: "Preparo", text: exam.preparationBefore },
    { label: "Prazo médio", text: exam.deliveryTime },
    { label: "No dia do exame", text: exam.preparationOnDay },
  ];

  if (exam.notes) {
    items.push({ label: "Observações", text: exam.notes });
  }

  items.push({ label: "Informar à clínica", text: exam.whenToInformClinic, wide: true });

  return items;
}

export function ExamPreparationDrawer({ exam, open, onOpenChange }: ExamPreparationDrawerProps) {
  if (!exam) return null;

  const items = buildPrepItems(exam);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="exam-modal" showCloseButton>
        <header className="exam-modal-head">
          <div className="exam-modal-head-top">
            <div className="exam-drawer-badges">
              <span className="exam-drawer-badge exam-drawer-badge--category">
                {DISPLAY_CATEGORY_LABELS[exam.displayCategory]}
              </span>
              <span className="exam-drawer-badge exam-drawer-badge--status">
                {PREPARATION_STATUS_LABELS[exam.preparationStatus]}
              </span>
            </div>
          </div>
          <DialogTitle className="exam-modal-title">{exam.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Orientações de preparo para {exam.name}
          </DialogDescription>
        </header>

        <div className="exam-modal-grid">
          {items.map((item) => (
            <div
              key={item.label}
              className={item.wide ? "exam-modal-item exam-modal-item--wide" : "exam-modal-item"}
            >
              <p className="exam-modal-item-label">{item.label}</p>
              <p className="exam-modal-item-text">{item.text}</p>
            </div>
          ))}
        </div>

        <p className="exam-modal-notice">
          Orientações podem variar conforme solicitação médica, PCMSO ou protocolo da clínica.
        </p>

        <footer className="exam-modal-footer">
          <CopyButton
            className="exam-modal-copy rounded-xl"
            label="Copiar preparo"
            onCopy={() => copyExamInstructions(exam)}
            successMessage="Orientações copiadas com sucesso."
            errorMessage="Não foi possível copiar as orientações."
          />
        </footer>
      </DialogContent>
    </Dialog>
  );
}
