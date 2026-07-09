"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { ExamGuide } from "@/data/exams";
import { ExamCard } from "@/components/public/ExamCard";
import { ExamPreparationDrawer } from "@/components/public/ExamPreparationDrawer";
import { EmptyState } from "@/components/ui/empty-state";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = (exam: ExamGuide) => {
    setSelectedExam(exam);
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (!examParam) return;
    const match = exams.find((exam) => exam.slug === examParam);
    if (match) {
      setSearch(match.name);
      setSelectedExam(match);
      setDrawerOpen(true);
    }
  }, [examParam, exams]);

  const filtered = useMemo(
    () => filterExamGuides(exams, search, filter),
    [exams, search, filter]
  );

  return (
    <>
      <div className="exam-catalog">
        <div className="exam-catalog-search-wrap">
          <Search className="exam-catalog-search-icon" aria-hidden />
          <Input
            id="exam-search-input"
            placeholder="Busque por audiometria, eletrocardiograma, raio-x, toxicológico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="exam-catalog-search-input"
            aria-label="Buscar exame"
          />
        </div>

        <div className="exam-catalog-filters" role="group" aria-label="Filtrar exames">
          {EXAM_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={cn(
                "exam-catalog-filter",
                filter === option.id && "exam-catalog-filter--active"
              )}
              aria-pressed={filter === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="exam-catalog-counter" aria-live="polite">
          <span className="exam-catalog-counter-value">{filtered.length}</span>
          {filtered.length === 1 ? " exame encontrado" : " exames encontrados"}
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            compact
            className="exam-catalog-empty"
            title="Nenhum exame encontrado"
            description="Tente buscar por outro nome ou selecione outra categoria."
            action={{
              label: "Limpar filtros",
              onClick: () => {
                setSearch("");
                setFilter("all");
              },
              variant: "outline",
            }}
          />
        ) : (
          <div className="exam-catalog-grid">
            {filtered.map((exam) => (
              <ExamCard key={exam.slug} exam={exam} onViewPreparation={openDrawer} />
            ))}
          </div>
        )}

        <div className="exam-catalog-disclaimer">
          <p>
            As orientações podem variar conforme solicitação médica, PCMSO, protocolo da clínica ou
            tipo de exame. Em caso de dúvida, fale com nossa equipe antes do atendimento.
          </p>
        </div>
      </div>

      <ExamPreparationDrawer exam={selectedExam} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
