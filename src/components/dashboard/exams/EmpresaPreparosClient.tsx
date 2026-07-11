"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Stethoscope,
} from "lucide-react";
import type { ExamDetailSerialized, ExamListItem } from "@/lib/exams";
import {
  EXAM_CATEGORY_LABELS,
  examNeedsPreparation,
  empresaPreparationBadgeLabel,
  examToGuide,
} from "@/lib/exams";
import { getExamDetail } from "@/actions/exams";
import { ExamPreparationDrawer } from "@/components/public/ExamPreparationDrawer";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useBreadcrumbSegmentLabel } from "@/components/dashboard/BreadcrumbLabelProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type EmpresaPreparosClientProps = {
  initialItems: ExamListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  filters: {
    q?: string;
    category?: string;
    preparationType?: string;
    card?: string;
  };
};

export function EmpresaPreparosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  filters,
}: EmpresaPreparosClientProps) {
  useBreadcrumbSegmentLabel("exames", "Preparos");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");
  const [category, setCategory] = useState(filters.category ?? "");
  const [prepFilter, setPrepFilter] = useState(() => {
    if (filters.card === "PREPARO_OBRIGATORIO") return "NECESSARIO";
    if (filters.preparationType === "SEM_PREPARO" || filters.card === "SEM_PREPARO") return "SEM";
    return "";
  });
  const [detail, setDetail] = useState<ExamDetailSerialized | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingExamId, setLoadingExamId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));
  const resultLabel =
    initialTotal === 1
      ? "1 orientação encontrada"
      : `${initialTotal} orientações encontradas`;

  const updateFilters = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === "ALL") params.delete(key);
      else params.set(key, value);
    });
    if (!patch.page) params.delete("page");
    startTransition(() => router.push(`/dashboard/exames?${params.toString()}`));
  };

  const applyPrepFilter = (value: string) => {
    setPrepFilter(value);
    if (value === "NECESSARIO") {
      updateFilters({
        card: "PREPARO_OBRIGATORIO",
        preparationType: undefined,
        q: q.trim() || undefined,
        category: category || undefined,
      });
      return;
    }
    if (value === "SEM") {
      updateFilters({
        card: undefined,
        preparationType: "SEM_PREPARO",
        q: q.trim() || undefined,
        category: category || undefined,
      });
      return;
    }
    updateFilters({
      card: undefined,
      preparationType: undefined,
      q: q.trim() || undefined,
      category: category || undefined,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setPrepFilter("");
    startTransition(() => router.push("/dashboard/exames"));
  };

  const hasActiveFilters = Boolean(
    filters.q || filters.category || filters.preparationType || filters.card
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = q.trim();
      if ((filters.q ?? "") === next) return;
      updateFilters({
        q: next || undefined,
        category: category || undefined,
        card: prepFilter === "NECESSARIO" ? "PREPARO_OBRIGATORIO" : undefined,
        preparationType: prepFilter === "SEM" ? "SEM_PREPARO" : undefined,
      });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const openDetail = async (id: string) => {
    setLoadingExamId(id);
    const result = await getExamDetail(id);
    setLoadingExamId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDetail(result.exam);
    setDetailOpen(true);
  };

  return (
    <PageModule className="preparos-empresa">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Preparos</h1>
          <p className="colaboradores-empresa-subtitle">
            Consulte orientações para os colaboradores antes dos exames.
          </p>
        </div>
      </header>

      <div className="colaboradores-empresa-filters">
        <div className="colaboradores-empresa-filters-row">
          <div className="colaboradores-empresa-search">
            <Search className="colaboradores-empresa-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar exame ou categoria"
              aria-label="Buscar preparos"
              className="colaboradores-empresa-search-input"
            />
          </div>

          <select
            value={category}
            onChange={(e) => {
              const value = e.target.value;
              setCategory(value);
              updateFilters({
                category: value || undefined,
                q: q.trim() || undefined,
                card: prepFilter === "NECESSARIO" ? "PREPARO_OBRIGATORIO" : undefined,
                preparationType: prepFilter === "SEM" ? "SEM_PREPARO" : undefined,
              });
            }}
            aria-label="Filtrar por categoria"
            className="colaboradores-empresa-select"
          >
            <option value="">Categoria</option>
            {Object.entries(EXAM_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={prepFilter}
            onChange={(e) => applyPrepFilter(e.target.value)}
            aria-label="Filtrar por preparo"
            className="colaboradores-empresa-select"
          >
            <option value="">Todos os preparos</option>
            <option value="NECESSARIO">Preparo necessário</option>
            <option value="SEM">Sem preparo específico</option>
          </select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="colaboradores-empresa-clear-btn rounded-lg"
              onClick={clearFilters}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {initialItems.length === 0 && !hasActiveFilters ? (
        <EmptyState
          compact
          className="colaboradores-empresa-empty"
          icon={Stethoscope}
          title="Nenhuma orientação disponível"
          description="O catálogo de preparos ainda não foi publicado pela clínica."
        />
      ) : (
        <div className="empresa-exams-panel preparos-empresa-panel relative">
          {isPending && <LoadingState overlay label="Atualizando..." />}

          <div className="colaboradores-empresa-result-bar preparos-empresa-result-bar">
            <p className="colaboradores-empresa-result-count">{resultLabel}</p>
          </div>

          {initialItems.length === 0 ? (
            <div className="empresa-exams-empty">
              <p>Nenhuma orientação encontrada com os filtros aplicados.</p>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="empresa-exams-list preparos-empresa-list">
              {initialItems.map((item) => {
                const needsPrep = examNeedsPreparation(item.preparationType);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      "empresa-exams-row preparos-empresa-row",
                      needsPrep && "preparos-empresa-row--needs-prep"
                    )}
                    disabled={loadingExamId === item.id}
                    onClick={() => openDetail(item.id)}
                  >
                    <span className="empresa-exams-row-icon" aria-hidden>
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <span className="empresa-exams-row-body">
                      <span className="empresa-exams-row-top">
                        <span className="empresa-exams-row-name">{item.name}</span>
                        <span
                          className={cn(
                            "preparos-empresa-badge",
                            needsPrep
                              ? "preparos-empresa-badge--needed"
                              : "preparos-empresa-badge--none"
                          )}
                        >
                          {empresaPreparationBadgeLabel(item.preparationType)}
                        </span>
                      </span>
                      {item.shortDescription ? (
                        <span className="empresa-exams-row-desc">{item.shortDescription}</span>
                      ) : null}
                      <span className="empresa-exams-row-meta">
                        <span className="empresa-exams-category">
                          {EXAM_CATEGORY_LABELS[item.category]}
                        </span>
                      </span>
                    </span>
                    <span className="empresa-exams-row-action" aria-hidden>
                      {loadingExamId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-green)]" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="colaboradores-empresa-pagination preparos-empresa-pagination">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={initialPage <= 1 || isPending}
                onClick={() => updateFilters({ page: String(initialPage - 1) })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="colaboradores-empresa-pagination-label">
                Página {initialPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={initialPage >= totalPages || isPending}
                onClick={() => updateFilters({ page: String(initialPage + 1) })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <ExamPreparationDrawer
        exam={detail ? examToGuide(detail) : null}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetail(null);
        }}
      />
    </PageModule>
  );
}
