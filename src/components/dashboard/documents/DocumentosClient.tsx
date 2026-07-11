"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  FolderKanban,
  FileCheck2,
  FileWarning,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { DocumentListItem, DocumentFormOptions } from "@/lib/documents";
import { DOCUMENT_KPI_CARDS, DOCUMENT_TYPE_LABELS, getDocumentDisplayStatus } from "@/lib/documents";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { buildFilterChips, removeFilterKey } from "@/lib/filter-chips-utils";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  DocumentAttachPanel,
  type AttachContext,
} from "./DocumentAttachPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const STAT_ICONS: Record<string, LucideIcon> = {
  pendentes_liberacao: FileWarning,
  liberados: FileCheck2,
};

type DocumentosClientProps = {
  initialItems: DocumentListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  canManage: boolean;
  formOptions: DocumentFormOptions;
  filters: Record<string, string | undefined>;
  isEmpresaPortal?: boolean;
};

function toAttachContext(item: DocumentListItem): AttachContext {
  return {
    documentId: item.id,
    referralId: item.referralId,
    companyId: item.companyId,
    companyName: item.companyName,
    patientId: item.patientId,
    patientName: item.patientName,
    protocol: item.protocol,
  };
}

function situationLabel(item: DocumentListItem) {
  const display = getDocumentDisplayStatus(item);
  if (display.status === "DISPONIVEL" && item.hasFile) return "Liberado";
  if (!item.hasFile) return "Aguardando arquivo";
  return display.label;
}

function examColumn(item: DocumentListItem): { primary: string; secondary?: string } {
  const examLabel = item.clinicalExamType
    ? CLINICAL_EXAM_LABELS[item.clinicalExamType] ?? item.clinicalExamType
    : null;
  const docCategory =
    item.type === "ASO"
      ? "ASO ocupacional"
      : item.type
        ? DOCUMENT_TYPE_LABELS[item.type] ?? undefined
        : undefined;

  if (examLabel && docCategory) {
    return { primary: examLabel, secondary: docCategory };
  }
  if (examLabel) return { primary: examLabel };
  if (docCategory) return { primary: docCategory };
  return { primary: "Não informado" };
}

export function DocumentosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  canManage,
  formOptions,
  filters,
}: DocumentosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [companyId, setCompanyId] = useState(filters.companyId ?? "");
  const [statusFilter, setStatusFilter] = useState(filters.status ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [attachContext, setAttachContext] = useState<AttachContext | null>(null);

  const activeCard = filters.card ?? "PENDENTES_LIBERACAO";
  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!("page" in updates)) params.delete("page");
      startTransition(() => {
        router.push(`/dashboard/documentos?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const applyToolbarFilters = () => {
    updateFilters({
      q: q || undefined,
      card: activeCard || undefined,
      companyId: companyId || undefined,
      status: statusFilter || undefined,
    });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setQ("");
    setCompanyId("");
    setStatusFilter("");
    startTransition(() => router.push("/dashboard/documentos?card=PENDENTES_LIBERACAO"));
  };

  const activeFilterCount = [filters.companyId, filters.status, filters.q].filter(Boolean).length;

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.companyId ||
      filters.status ||
      (filters.card && filters.card !== "PENDENTES_LIBERACAO")
  );

  const activeChips = useMemo(
    () =>
      buildFilterChips([
        { key: "q", value: filters.q, label: (v) => `Busca: ${v}` },
        {
          key: "card",
          value: filters.card && filters.card !== "PENDENTES_LIBERACAO" ? filters.card : undefined,
          label: (v) => DOCUMENT_KPI_CARDS.find((c) => c.filter === v)?.label ?? v,
        },
        {
          key: "companyId",
          value: filters.companyId,
          label: (v) =>
            `Empresa: ${
              formOptions.companies.find((c) => c.id === v)?.tradeName ??
              formOptions.companies.find((c) => c.id === v)?.legalName ??
              v
            }`,
        },
        {
          key: "status",
          value: filters.status,
          label: (v) => `Situação: ${v === "PENDENTE" ? "Aguardando arquivo" : v === "DISPONIVEL" ? "Liberado" : v}`,
        },
      ]),
    [filters, formOptions.companies]
  );

  const removeChip = (key: string) => {
    if (key === "q") setQ("");
    if (key === "companyId") setCompanyId("");
    if (key === "status") setStatusFilter("");
    if (key === "card") {
      updateFilters({ ...removeFilterKey(key, filters), card: "PENDENTES_LIBERACAO" });
      return;
    }
    updateFilters(removeFilterKey(key, filters));
  };

  const pendingQueue = useMemo(
    () =>
      initialItems
        .filter((item) => {
          const display = getDocumentDisplayStatus(item);
          return !(display.status === "DISPONIVEL" && item.hasFile);
        })
        .map(toAttachContext),
    [initialItems]
  );

  const openAttach = (item: DocumentListItem) => {
    setAttachContext(toAttachContext(item));
    setPanelOpen(true);
  };

  useEffect(() => {
    setQ(filters.q ?? "");
    setCompanyId(filters.companyId ?? "");
    setStatusFilter(filters.status ?? "");
  }, [filters]);

  useEffect(() => {
    if (!filters.card && !searchParams.get("card")) {
      updateFilters({ card: "PENDENTES_LIBERACAO" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resultLabel =
    initialTotal === 1 ? "1 colaborador na fila" : `${initialTotal} na fila`;

  return (
    <PageModule className="documentos-clinica documentos-ops">
      <header className="documentos-ops-header">
        <div className="documentos-ops-header-copy">
          <h1 className="documentos-ops-title">Documentos</h1>
          <p className="documentos-ops-subtitle">
            Gerencie os documentos dos atendimentos e libere-os para as empresas após a
            conferência.
          </p>
        </div>

        <div className="documentos-ops-chips" role="group" aria-label="Indicadores da fila">
          {DOCUMENT_KPI_CARDS.map((card) => {
            const Icon = STAT_ICONS[card.key] ?? FolderOpen;
            const isActive = activeCard === card.filter;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => updateFilters({ card: card.filter })}
                className={cn(
                  "documentos-ops-chip",
                  card.key === "pendentes_liberacao" && "documentos-ops-chip--pending",
                  card.key === "liberados" && "documentos-ops-chip--done",
                  isActive && "documentos-ops-chip--active"
                )}
                aria-pressed={isActive}
              >
                <span className="documentos-ops-chip-icon" aria-hidden>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="documentos-ops-chip-value">{statCounts[card.key] ?? 0}</span>
                <span className="documentos-ops-chip-label">{card.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="documentos-ops-divider" aria-hidden />

      <div className="documentos-ops-table-shell relative">
        {isPending && <LoadingState overlay label="Atualizando fila..." />}

        <div className="documentos-ops-toolbar">
          <div className="documentos-ops-search">
            <Search className="documentos-ops-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyToolbarFilters()}
              placeholder="Buscar por colaborador, empresa, função ou exame"
              aria-label="Buscar na fila de documentos"
              className="documentos-ops-search-input"
            />
          </div>

          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="documentos-ops-filter-btn h-9 rounded-lg"
                  aria-label="Abrir filtros"
                >
                  <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                  {activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : "Filtros"}
                </Button>
              }
            />
            <PopoverContent align="end" className="documentos-ops-filter-popover w-72 p-3">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Empresa
                  </label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="colaboradores-empresa-select w-full"
                    aria-label="Filtrar por empresa"
                  >
                    <option value="">Todas</option>
                    {formOptions.companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tradeName ?? c.legalName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Situação
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="colaboradores-empresa-select w-full"
                    aria-label="Filtrar por situação"
                  >
                    <option value="">Todas</option>
                    <option value="PENDENTE">Aguardando arquivo</option>
                    <option value="EM_EMISSAO">Em elaboração</option>
                    <option value="DISPONIVEL">Liberado</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg"
                    onClick={() => {
                      setCompanyId("");
                      setStatusFilter("");
                    }}
                  >
                    Limpar
                  </Button>
                  <Button
                    type="button"
                    variant="brand"
                    size="sm"
                    className="flex-1 rounded-lg shadow-none"
                    onClick={applyToolbarFilters}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 rounded-lg text-slate-500"
              onClick={clearFilters}
            >
              Limpar
            </Button>
          )}
        </div>

        {activeChips.length > 0 && (
          <div className="documentos-ops-chips-row">
            <FilterChips chips={activeChips} onRemove={removeChip} onClearAll={clearFilters} />
          </div>
        )}

        <div className="documentos-ops-result-bar">
          <span>{resultLabel}</span>
        </div>

        {initialItems.length === 0 ? (
          <EmptyState
            compact
            icon={FolderOpen}
            title="Nenhum documento pendente"
            description="Os documentos dos atendimentos aparecerão aqui quando precisarem de conferência."
          />
        ) : (
          <>
            <div className="documentos-ops-table-scroll">
              <table className="documentos-ops-table">
                <thead>
                  <tr>
                    <th className="documentos-ops-col-collaborator">Colaborador</th>
                    <th className="documentos-ops-col-company">Empresa</th>
                    <th className="documentos-ops-col-role">Função</th>
                    <th className="documentos-ops-col-exam">Tipo de exame</th>
                    <th className="documentos-ops-col-date">Data</th>
                    <th className="documentos-ops-col-status">Situação</th>
                    {canManage && <th className="documentos-ops-col-action">Ação</th>}
                  </tr>
                </thead>
                <tbody>
                  {initialItems.map((item) => {
                    const display = getDocumentDisplayStatus(item);
                    const isLiberado = display.status === "DISPONIVEL" && item.hasFile;
                    const exam = examColumn(item);
                    return (
                      <tr key={item.id}>
                        <td className="documentos-ops-col-collaborator">
                          <span className="documentos-ops-name">
                            {item.patientName ?? "Não informado"}
                          </span>
                        </td>
                        <td className="documentos-ops-col-company">
                          <span
                            className="documentos-ops-ellipsis"
                            title={item.companyName ?? undefined}
                          >
                            {item.companyName ?? "Não informado"}
                          </span>
                        </td>
                        <td className="documentos-ops-col-role">
                          <span className="documentos-ops-ellipsis" title={item.jobTitle ?? undefined}>
                            {item.jobTitle?.trim() ? item.jobTitle : "Não informado"}
                          </span>
                        </td>
                        <td className="documentos-ops-col-exam">
                          <div className="documentos-ops-exam-stack">
                            <span className="documentos-ops-exam-primary">{exam.primary}</span>
                            {exam.secondary ? (
                              <span className="documentos-ops-exam-secondary">{exam.secondary}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="documentos-ops-col-date">
                          {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="documentos-ops-col-status">
                          <StatusBadge
                            status={display.status}
                            type="document"
                            label={situationLabel(item)}
                            className={cn(
                              "documentos-ops-status",
                              isLiberado && "documentos-ops-status--liberado"
                            )}
                          />
                        </td>
                        {canManage && (
                          <td className="documentos-ops-col-action">
                            <Button
                              type="button"
                              variant="brand"
                              size="sm"
                              className="documentos-ops-manage-btn"
                              onClick={() => openAttach(item)}
                            >
                              <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              Gerenciar
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="documentos-ops-mobile">
              {initialItems.map((item) => {
                const display = getDocumentDisplayStatus(item);
                const exam = examColumn(item);
                return (
                  <article key={item.id} className="documentos-ops-mobile-card">
                    <p className="documentos-ops-name">
                      {item.patientName ?? "Não informado"}
                    </p>
                    <p className="documentos-ops-mobile-meta">
                      {item.companyName ?? "Não informado"}
                    </p>
                    <p className="documentos-ops-mobile-meta documentos-ops-mobile-meta--spaced">
                      {item.jobTitle?.trim() ? item.jobTitle : "Não informado"}
                    </p>
                    <p className="documentos-ops-mobile-meta">{exam.primary}</p>
                    <div className="documentos-ops-mobile-status">
                      <StatusBadge
                        status={display.status}
                        type="document"
                        label={situationLabel(item)}
                        className="documentos-ops-status"
                      />
                    </div>
                    {canManage && (
                      <Button
                        type="button"
                        variant="brand"
                        size="sm"
                        className="documentos-ops-manage-btn"
                        onClick={() => openAttach(item)}
                      >
                        <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Gerenciar
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}

        {initialTotal > 0 && (
          <div className="documentos-ops-pagination">
            <p className="documentos-ops-pagination-meta">
              {totalPages > 1
                ? `Página ${initialPage} de ${totalPages}`
                : `${Math.min(pageSize, initialTotal)} por página`}
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-lg p-0"
                disabled={initialPage <= 1 || isPending || totalPages <= 1}
                onClick={() => updateFilters({ page: String(initialPage - 1) })}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-lg p-0"
                disabled={initialPage >= totalPages || isPending || totalPages <= 1}
                onClick={() => updateFilters({ page: String(initialPage + 1) })}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <DocumentAttachPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        context={attachContext}
        pendingQueue={pendingQueue}
        onDone={() => router.refresh()}
        onOpenNext={(next) => {
          setAttachContext(next);
          setPanelOpen(true);
        }}
      />
    </PageModule>
  );
}
