"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { ExamGuide } from "@/data/exams";
import { ExamCard } from "@/components/public/ExamCard";
import { ExamPreparationModal } from "@/components/public/ExamPreparationModal";
import { Input } from "@/components/ui/input";
import {
  EXAM_FILTER_OPTIONS,
  filterExamGuides,
  type ExamFilterId,
} from "@/lib/exam-preparation";
import { cn } from "@/lib/utils";

type ExamSearchProps = {
  exams: ExamGuide[];
};

export function ExamSearch({ exams }: ExamSearchProps) {
  const searchParams = useSearchParams();
  const examParam = searchParams.get("exame");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ExamFilterId>("all");
  const [selectedExam, setSelectedExam] = useState<ExamGuide | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (exam: ExamGuide) => {
    setSelectedExam(exam);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!examParam) return;
    const match = exams.find((exam) => exam.slug === examParam);
    if (match) {
      setSearch(match.name);
      setSelectedExam(match);
      setModalOpen(true);
    }
  }, [examParam, exams]);

  const filtered = useMemo(
    () => filterExamGuides(exams, search, filter),
    [exams, search, filter]
  );

  return (
    <>
      <div className="exam-catalog-panel">
        <div className="exam-catalog-toolbar">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              placeholder="Buscar exame..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="exam-catalog-search rounded-lg border-slate-200 bg-white pl-9"
              aria-label="Buscar exame"
            />
          </div>
        </div>

        <div className="exam-catalog-filters" role="group" aria-label="Filtrar exames">
          {EXAM_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={cn(
                "exam-catalog-filter-chip",
                filter === option.id && "exam-catalog-filter-chip--active"
              )}
              aria-pressed={filter === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="exam-catalog-counter" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "exame encontrado" : "exames encontrados"}
        </p>

        {filtered.length === 0 ? (
          <div className="exam-catalog-empty">
            <p className="exam-catalog-empty-title">Nenhum exame encontrado</p>
            <p className="exam-catalog-empty-text">
              Tente buscar por outro nome ou selecione outra categoria.
            </p>
          </div>
        ) : (
          <div className="exam-catalog-grid">
            {filtered.map((exam) => (
              <ExamCard key={exam.slug} exam={exam} onViewPreparation={openModal} />
            ))}
          </div>
        )}

        <p className="exam-catalog-disclaimer">
          As orientações podem variar conforme solicitação médica, PCMSO, protocolo da clínica ou
          tipo de exame. Em caso de dúvida, fale com nossa equipe antes do atendimento.
        </p>
      </div>

      <ExamPreparationModal
        exam={selectedExam}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
