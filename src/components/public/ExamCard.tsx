"use client";

import { useState, type MouseEvent } from "react";
import {
  Check,
  Clock3,
  Copy,
  FlaskConical,
  Microscope,
  Radiation,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import type { ExamGuide } from "@/data/exams";
import {
  copyExamInstructions,
  DISPLAY_CATEGORY_LABELS,
  getExamStatusChip,
  type ExamStatusTone,
} from "@/lib/exam-preparation";
import { cn } from "@/lib/utils";

type ExamCardProps = {
  exam: ExamGuide;
  onViewPreparation: (exam: ExamGuide) => void;
  className?: string;
};

const CATEGORY_ICONS = {
  COMPLEMENTAR: Stethoscope,
  LABORATORIAL: FlaskConical,
  IMAGEM: Radiation,
  TOXICOLOGICO: Microscope,
} as const;

const STATUS_CLASS: Record<ExamStatusTone, string> = {
  neutral: "exam-card-status--neutral",
  warning: "exam-card-status--warning",
  success: "exam-card-status--success",
  info: "exam-card-status--info",
  caution: "exam-card-status--caution",
};

export function ExamCard({ exam, onViewPreparation, className }: ExamCardProps) {
  const CategoryIcon = CATEGORY_ICONS[exam.displayCategory] ?? Stethoscope;
  const status = getExamStatusChip(exam);
  const [copied, setCopied] = useState(false);

  const copy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      await copyExamInstructions(exam);
      setCopied(true);
      toast.success("Orientações copiadas com sucesso.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar as orientações.");
    }
  };

  const open = () => onViewPreparation(exam);

  return (
    <article
      className={cn("exam-card group", className)}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
    >
      <button
        type="button"
        className="exam-card-share"
        onClick={copy}
        aria-label={`Copiar preparo de ${exam.name}`}
        title="Copiar preparo"
      >
        {copied ? <Check strokeWidth={2} /> : <Copy strokeWidth={1.75} />}
      </button>

      <div className="exam-card-top">
        <div className="exam-card-icon" aria-hidden>
          <CategoryIcon strokeWidth={1.75} />
        </div>
        <span className="exam-card-category">{DISPLAY_CATEGORY_LABELS[exam.displayCategory]}</span>
      </div>

      <h3 className="exam-card-title">{exam.name}</h3>
      <p className="exam-card-summary">{exam.preparationSummary}</p>

      <div className="exam-card-meta">
        <div className="exam-card-meta-item">
          <Clock3 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
          <span>{exam.deliveryTime}</span>
        </div>
        <span className={cn("exam-card-status", STATUS_CLASS[status.tone])}>{status.label}</span>
      </div>

      {exam.notes && <p className="exam-card-note">{exam.notes}</p>}

      <span className="exam-card-link">
        Ver preparo completo
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </article>
  );
}
