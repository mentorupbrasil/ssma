"use client";

import type { ReactNode } from "react";
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

function ModalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="exam-drawer-section">
      <h3 className="exam-drawer-section-title">{title}</h3>
      <div className="exam-drawer-section-body">{children}</div>
    </section>
  );
}

export function ExamPreparationDrawer({ exam, open, onOpenChange }: ExamPreparationDrawerProps) {
  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="exam-modal" showCloseButton>
        <div className="exam-modal-head">
          <div className="exam-drawer-badges">
            <span className="exam-drawer-badge exam-drawer-badge--category">
              {DISPLAY_CATEGORY_LABELS[exam.displayCategory]}
            </span>
            <span className="exam-drawer-badge exam-drawer-badge--status">
              {PREPARATION_STATUS_LABELS[exam.preparationStatus]}
            </span>
          </div>
          <DialogTitle className="exam-drawer-title">{exam.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Orientações de preparo para {exam.name}
          </DialogDescription>
        </div>

        <div className="exam-modal-body">
          <ModalSection title="Preparo necessário">
            <p>{exam.preparationBefore}</p>
          </ModalSection>
          <ModalSection title="Prazo médio">
            <p>{exam.deliveryTime}</p>
          </ModalSection>
          <ModalSection title="No dia do exame">
            <p>{exam.preparationOnDay}</p>
          </ModalSection>
          {exam.notes && (
            <ModalSection title="Observações importantes">
              <p>{exam.notes}</p>
            </ModalSection>
          )}
          <ModalSection title="Quando informar a clínica">
            <p>{exam.whenToInformClinic}</p>
          </ModalSection>
          <div className="exam-drawer-notice">
            As orientações podem variar conforme solicitação médica, PCMSO, protocolo da clínica ou
            tipo de exame.
          </div>
        </div>

        <div className="exam-modal-footer">
          <CopyButton
            className="w-full rounded-xl"
            label="Copiar preparo"
            onCopy={() => copyExamInstructions(exam)}
            successMessage="Orientações copiadas com sucesso."
            errorMessage="Não foi possível copiar as orientações."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
