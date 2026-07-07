"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ExamCard } from "@/components/public/ExamCard";
import { Search } from "lucide-react";
import { EXAM_CATEGORY_LABELS } from "@/types";

type Exam = {
  id: string;
  name: string;
  category: string;
  preparation: string | null;
  deliveryTime: string | null;
  notes: string | null;
};

export function ExamSearch({ exams }: { exams: Exam[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => [...new Set(exams.map((e) => e.category))], [exams]);

  const filtered = exams.filter((exam) => {
    const matchSearch = exam.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || exam.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="exam-catalog-panel space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar exame..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border-slate-200 bg-white pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {EXAM_CATEGORY_LABELS[cat] ?? cat}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Nenhum exame encontrado para os filtros selecionados.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exam) => (
            <ExamCard
              key={exam.id}
              name={exam.name}
              category={exam.category}
              preparation={exam.preparation ?? "Consulte a clínica para orientações específicas."}
              deliveryTime={exam.deliveryTime ?? "A definir conforme o exame"}
              notes={exam.notes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
