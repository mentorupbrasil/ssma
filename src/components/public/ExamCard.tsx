"use client";

import { Clock3, Share2 } from "lucide-react";
import type { ExamGuide } from "@/data/exams";
import { buildWhatsAppShareMessage, DISPLAY_CATEGORY_LABELS } from "@/lib/exam-preparation";
import { whatsappLink } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExamCardProps = {
  exam: ExamGuide;
  onViewPreparation: (exam: ExamGuide) => void;
  className?: string;
};

export function ExamCard({ exam, onViewPreparation, className }: ExamCardProps) {
  const share = () => {
    window.open(whatsappLink(buildWhatsAppShareMessage(exam)), "_blank", "noopener,noreferrer");
  };

  return (
    <article className={cn("exam-prep-card group", className)}>
      <div className="exam-prep-card-top">
        <h3 className="exam-prep-card-title">{exam.name}</h3>
        <span className="exam-prep-card-category">
          {DISPLAY_CATEGORY_LABELS[exam.displayCategory]}
        </span>
      </div>

      <p className="exam-prep-card-summary">{exam.preparationSummary}</p>

      <div className="exam-prep-card-meta">
        <div className="exam-prep-card-meta-item">
          <Clock3 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
          <span>{exam.deliveryTime}</span>
        </div>
      </div>

      {exam.notes && <p className="exam-prep-card-note">{exam.notes}</p>}

      <div className="exam-prep-card-actions">
        <Button
          size="sm"
          variant="brand"
          className="exam-prep-card-btn w-full rounded-lg"
          onClick={() => onViewPreparation(exam)}
        >
          Ver preparo
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="exam-prep-card-btn w-full rounded-lg"
          onClick={share}
        >
          <Share2 className="mr-2 h-3.5 w-3.5" />
          Compartilhar
        </Button>
      </div>
    </article>
  );
}
