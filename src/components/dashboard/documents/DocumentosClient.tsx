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
  Paperclip,
  FileCheck2,
  FileWarning,
  Download,
  type LucideIcon,
} from "lucide-react";
import type { DocumentListItem, DocumentFormOptions } from "@/lib/documents";
import { DOCUMENT_KPI_CARDS, getDocumentDisplayStatus } from "@/lib/documents";
import { updateDocumentStatus } from "@/actions/documents";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STAT_ICONS: Record<string, LucideIcon> = {
  pendentes_liberacao: FileWarning,
  liberados: FileCheck2,
};

const STAT_TONES: Record<string, "primary" | "warning"> = {
  pendentes_liberacao: "warning",
  liberados: "primary",
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [attachContext, setAttachContext] = useState<AttachContext | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const pushCurrentFilters = (extra?: Record<string, string | undefined>) => {
    updateFilters({
      q: q || undefined,
      card: activeCard || undefined,
      companyId: companyId || undefined,
      ...extra,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCompanyId("");
    startTransition(() => router.push("/dashboard/documentos?card=PENDENTES_LIBERACAO"));
  };

  const hasActiveFilters = Boolean(
    filters.q || filters.companyId || (filters.card && filters.card !== "PENDENTES_LIBERACAO")
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
      ]),
    [filters, formOptions.companies]
  );

  const removeChip = (key: string) => {
    if (key === "q") setQ("");
    if (key === "companyId") setCompanyId("");
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

  const openNext = (next: AttachContext) => {
    setAttachContext(next);
    setPanelOpen(true);
  };

  const liberar = async (id: string) => {
    setActionLoading(id);
    const result = await updateDocumentStatus(id, "DISPONIVEL");
    setActionLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Liberado para a empresa.");
    router.refresh();
  };

  useEffect(() => {
    setQ(filters.q ?? "");
    setCompanyId(filters.companyId ?? "");
  }, [filters]);

  // Entrada padrão: fila de pendentes (trabalho em massa)
  useEffect(() => {
    if (!filters.card && !searchParams.get("card")) {
      updateFilters({ card: "PENDENTES_LIBERACAO" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resultLabel =
    initialTotal === 1 ? "1 colaborador na fila" : `${initialTotal} na fila`;

  return (
    <PageModule className="documentos-clinica atendimentos-clinica">
      <header className="sys-page-header">
        <div>
          <h1 className="sys-page-title">Documentos</h1>
          <p className="sys-page-subtitle">
            Fila de pendentes por colaborador. Abra cada um, anexe os arquivos e libere para a
            empresa.
          </p>
        </div>
      </header>

      <div className="colaboradores-empresa-stats documentos-clinica-stats">
        {DOCUMENT_KPI_CARDS.map((card) => {
          const Icon = STAT_ICONS[card.key] ?? FolderOpen;
          const isActive = activeCard === card.filter;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => updateFilters({ card: card.filter })}
              className={cn(
                "colaboradores-empresa-stat colaboradores-empresa-stat--clickable",
                isActive && "colaboradores-empresa-stat--active"
              )}
            >
              <span
                className={cn(
                  "colaboradores-empresa-stat-icon",
                  `colaboradores-empresa-stat-icon--${STAT_TONES[card.key] ?? "primary"}`
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="colaboradores-empresa-stat-body">
                <span className="colaboradores-empresa-stat-value">
                  {statCounts[card.key] ?? 0}
                </span>
                <span className="colaboradores-empresa-stat-title">{card.label}</span>
                <span className="colaboradores-empresa-stat-hint">{card.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="sys-toolbar colaboradores-empresa-filters">
        <div className="colaboradores-empresa-filters-row">
          <div className="colaboradores-empresa-search">
            <Search className="colaboradores-empresa-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pushCurrentFilters()}
              placeholder="Empresa, colaborador ou protocolo"
              aria-label="Buscar na fila"
              className="colaboradores-empresa-search-input"
            />
          </div>

          <select
            value={companyId}
            onChange={(e) => {
              const value = e.target.value;
              setCompanyId(value);
              pushCurrentFilters({ companyId: value || undefined });
            }}
            aria-label="Empresa"
            className="colaboradores-empresa-select"
          >
            <option value="">Empresa</option>
            {formOptions.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tradeName ?? c.legalName}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" className="rounded-md" onClick={clearFilters}>
              Limpar
            </Button>
          )}
        </div>

        {activeChips.length > 0 && (
          <div className="colaboradores-empresa-chips">
            <FilterChips chips={activeChips} onRemove={removeChip} onClearAll={clearFilters} />
          </div>
        )}
      </div>

      <div className="colaboradores-empresa-table-wrap relative sys-table-panel">
        {isPending && <LoadingState overlay label="Atualizando fila..." />}

        <div className="colaboradores-empresa-result-bar">
          <span className="text-xs text-slate-500">{resultLabel}</span>
        </div>

        {initialItems.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Nenhum pendente na fila"
            description="Quando houver atendimentos concluídos aguardando documentação, eles aparecem aqui."
          />
        ) : (
          <div className="colaboradores-empresa-table-scroll">
            <table className="colaboradores-empresa-table sys-data-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Empresa</th>
                  <th>Protocolo</th>
                  <th>Data</th>
                  <th>Situação</th>
                  {canManage && <th className="colaboradores-empresa-th-actions">Ação</th>}
                </tr>
              </thead>
              <tbody>
                {initialItems.map((item) => {
                  const display = getDocumentDisplayStatus(item);
                  const isLiberado = display.status === "DISPONIVEL" && item.hasFile;
                  return (
                    <tr key={item.id} className="atendimentos-clinica-row">
                      <td>
                        <div className="atendimentos-clinica-stack">
                          <span className="atendimentos-clinica-primary-text">
                            {item.patientName ?? "—"}
                          </span>
                          <span className="atendimentos-clinica-meta">{item.title}</span>
                        </div>
                      </td>
                      <td>{item.companyName ?? "—"}</td>
                      <td className="font-mono text-xs text-slate-500">
                        {item.protocol ?? "—"}
                      </td>
                      <td className="whitespace-nowrap tabular-nums text-sm text-slate-600">
                        {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td>
                        <StatusBadge
                          status={display.status}
                          type="document"
                          label={isLiberado ? "Liberado" : display.label}
                        />
                      </td>
                      {canManage && (
                        <td className="colaboradores-empresa-td-actions">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {item.hasFile && (
                              <a
                                href={`/api/documents/${item.id}/file`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex"
                              >
                                <Button type="button" variant="ghost" size="sm" className="rounded-md">
                                  <Download className="mr-1.5 h-3.5 w-3.5" />
                                  Ver
                                </Button>
                              </a>
                            )}
                            {!isLiberado && item.hasFile && (
                              <Button
                                type="button"
                                variant="brand"
                                size="sm"
                                className="rounded-md"
                                disabled={actionLoading === item.id}
                                onClick={() => liberar(item.id)}
                              >
                                Liberar
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant={isLiberado ? "outline" : "brand"}
                              size="sm"
                              className="rounded-md"
                              onClick={() => openAttach(item)}
                            >
                              <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                              {isLiberado ? "Arquivos" : "Anexar"}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {initialTotal > pageSize && (
        <div className="colaboradores-empresa-pagination">
          <p className="text-sm text-slate-500">
            {resultLabel} · Página {initialPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={initialPage <= 1 || isPending}
              onClick={() => updateFilters({ page: String(initialPage - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={initialPage >= totalPages || isPending}
              onClick={() => updateFilters({ page: String(initialPage + 1) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <DocumentAttachPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        context={attachContext}
        pendingQueue={pendingQueue}
        onDone={() => router.refresh()}
        onOpenNext={(next) => openNext(next)}
      />
    </PageModule>
  );
}
