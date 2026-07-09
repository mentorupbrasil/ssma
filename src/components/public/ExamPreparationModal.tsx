"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MessageCircle, X } from "lucide-react";
import type { ExamGuide } from "@/data/exams";
import {
  buildWhatsAppShareMessage,
  copyExamInstructions,
  DISPLAY_CATEGORY_LABELS,
  PREPARATION_STATUS_LABELS,
} from "@/lib/exam-preparation";
import { whatsappLink } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ExamPreparationModalProps = {
  exam: ExamGuide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ModalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="exam-prep-modal-section">
      <h3 className="exam-prep-modal-section-title">{title}</h3>
      <div className="exam-prep-modal-section-body">{children}</div>
    </section>
  );
}

export function ExamPreparationModal({ exam, open, onOpenChange }: ExamPreparationModalProps) {
  if (!exam) return null;

  const handleWhatsApp = () => {
    window.open(whatsappLink(buildWhatsAppShareMessage(exam)), "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn("exam-prep-modal", "gap-0 overflow-hidden p-0 sm:max-w-lg")}
        aria-describedby={`exam-prep-desc-${exam.slug}`}
      >
        <div className="exam-prep-modal-header">
          <div className="exam-prep-modal-header-main">
            <div className="exam-prep-modal-badges">
              <span className="exam-prep-badge exam-prep-badge--category">
                {DISPLAY_CATEGORY_LABELS[exam.displayCategory]}
              </span>
              <span className="exam-prep-badge exam-prep-badge--status">
                {PREPARATION_STATUS_LABELS[exam.preparationStatus]}
              </span>
            </div>
            <DialogTitle className="exam-prep-modal-title">{exam.name}</DialogTitle>
          </div>
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="exam-prep-modal-close shrink-0"
                aria-label="Fechar modal de preparo"
              />
            }
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        <div className="exam-prep-modal-scroll" id={`exam-prep-desc-${exam.slug}`}>
          <ModalSection title="Preparo antes do exame">
            <p>{exam.preparationBefore}</p>
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
        </div>

        <div className="exam-prep-modal-footer">
          <Link href="/encaminhamento-online" className="w-full sm:w-auto">
            <Button variant="brand" size="sm" className="w-full rounded-lg">
              Fazer encaminhamento online
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-lg sm:w-auto"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Compartilhar no WhatsApp
          </Button>
          <CopyButton
            className="w-full rounded-lg sm:w-auto"
            label="Copiar orientações"
            onCopy={() => copyExamInstructions(exam)}
            successMessage="Orientações copiadas com sucesso."
            errorMessage="Não foi possível copiar as orientações."
          />
          <DialogClose
            render={
              <Button variant="ghost" size="sm" className="w-full rounded-lg sm:w-auto">
                Fechar
              </Button>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
