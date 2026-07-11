"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import type { ReferralListItem } from "@/lib/referrals";
import { CLINICAL_EXAM_LABELS } from "@/types";
import {
  EMPRESA_EXAMES_STATUS_FILTER_OPTIONS,
  empresaReferralDisplayStatus,
} from "@/lib/empresa-portal";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ExamesEmpresaListSectionProps = {
  items: ReferralListItem[];
  total: number;
  page: number;
  pageSize: number;
  isPending: boolean;
  filters: {
    q?: string;
    status?: string;
    clinicalExamType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  onSearch: (values: {
    q: string;
    status: string;
    clinicalExamType: string;
    dateFrom: string;
    dateTo: string;
  }) => void;
  onClear: () => void;
  onPageChange: (page: number) => void;
  onOpenDetail: (id: string) => void;
  detailLoading: boolean;
  selectedId: string | null;
  activeChips: { key: string; label: string }[];
  onRemoveChip: (key: string) => void;
};

export function ExamesEmpresaListSection({
  items,
  total,
  page,
  pageSize,
  isPending,
  filters,
  onSearch,
  onClear,
  onPageChange,
  onOpenDetail,
  detailLoading,
  selectedId,
  activeChips,
  onRemoveChip,
}: ExamesEmpresaListSectionProps) {
  const [q, setQ] = useState(filters.q ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  const [clinicalExamType, setClinicalExamType] = useState(filters.clinicalExamType ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    Boolean(filters.dateFrom || filters.dateTo)
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const resultLabel =
    total === 1 ? "1 solicitação encontrada" : `${total} solicitações encontradas`;

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.q ||
          filters.status ||
          filters.clinicalExamType ||
          filters.dateFrom ||
          filters.dateTo
      ),
    [filters]
  );

  const advancedFilterCount = [filters.dateFrom, filters.dateTo].filter(Boolean).length;

  const pushFilters = (extra?: Partial<{ dateFrom: string; dateTo: string }>) => {
    onSearch({
      q,
      status,
      clinicalExamType,
      dateFrom: extra?.dateFrom ?? dateFrom,
      dateTo: extra?.dateTo ?? dateTo,
    });
  };

  return (
    <>
      <div className="colaboradores-empresa-filters">
        <div className="colaboradores-empresa-filters-row">
          <div className="colaboradores-empresa-search">
            <Search className="colaboradores-empresa-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pushFilters()}
              placeholder="Buscar por colaborador, CPF ou tipo de exame"
              aria-label="Buscar exames"
              className="colaboradores-empresa-search-input"
            />
          </div>

          <select
            value={clinicalExamType}
            onChange={(e) => {
              const value = e.target.value;
              setClinicalExamType(value);
              onSearch({ q, status, clinicalExamType: value, dateFrom, dateTo });
            }}
            aria-label="Filtrar por tipo de exame"
            className="colaboradores-empresa-select"
          >
            <option value="">Tipo de exame</option>
            {Object.entries(CLINICAL_EXAM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              onSearch({
                q,
                status: e.target.value,
                clinicalExamType,
                dateFrom,
                dateTo,
              });
            }}
            aria-label="Filtrar por status"
            className="colaboradores-empresa-select"
          >
            {EMPRESA_EXAMES_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="colaboradores-empresa-more-btn rounded-lg"
            onClick={() => setMoreFiltersOpen((open) => !open)}
            aria-expanded={moreFiltersOpen}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Mais filtros
            {advancedFilterCount > 0 && (
              <span className="colaboradores-empresa-filter-count">{advancedFilterCount}</span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="colaboradores-empresa-clear-btn rounded-lg"
              onClick={onClear}
            >
              Limpar
            </Button>
          )}
        </div>

        {moreFiltersOpen && (
          <div className="colaboradores-empresa-filters-advanced">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                pushFilters({ dateFrom: e.target.value });
              }}
              aria-label="Data inicial"
              className="colaboradores-empresa-select h-[2.25rem]"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                pushFilters({ dateTo: e.target.value });
              }}
              aria-label="Data final"
              className="colaboradores-empresa-select h-[2.25rem]"
            />
          </div>
        )}

        {activeChips.length > 0 && (
          <div className="colaboradores-empresa-chips">
            <FilterChips chips={activeChips} onRemove={onRemoveChip} onClearAll={onClear} />
          </div>
        )}
      </div>

      <div className="colaboradores-empresa-table-wrap relative">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-green)]" />
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            compact
            className="colaboradores-empresa-empty"
            title="Nenhuma solicitação encontrada"
            description="Envie uma nova solicitação ou ajuste os filtros."
            action={{
              label: "Solicitar exame",
              href: "/dashboard/encaminhamentos/novo",
            }}
          />
        ) : (
          <>
            <div className="colaboradores-empresa-result-bar">
              <p className="colaboradores-empresa-result-count">{resultLabel}</p>
            </div>
            <div className="colaboradores-empresa-table-scroll">
              <table className="colaboradores-empresa-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Função</th>
                    <th>Tipo de exame</th>
                    <th>Data da solicitação</th>
                    <th>Data e horário do agendamento</th>
                    <th>Status</th>
                    <th className="colaboradores-empresa-th-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const display = empresaReferralDisplayStatus(item.status, item.scheduledAt);
                    return (
                      <tr key={item.id} className="colaboradores-empresa-row">
                        <td>
                          <div className="colaboradores-empresa-name">{item.employeeName}</div>
                        </td>
                        <td>
                          {item.jobTitle ? (
                            <span className="colaboradores-empresa-role">{item.jobTitle}</span>
                          ) : (
                            <span className="colaboradores-empresa-muted">—</span>
                          )}
                        </td>
                        <td>
                          {
                            CLINICAL_EXAM_LABELS[
                              item.clinicalExamType as keyof typeof CLINICAL_EXAM_LABELS
                            ]
                          }
                        </td>
                        <td>
                          {format(new Date(item.requestedDate), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td>
                          {item.scheduledAt ? (
                            <>
                              <div className="colaboradores-empresa-exam-type">
                                {format(new Date(item.scheduledAt), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </div>
                              <div className="colaboradores-empresa-exam-date">
                                {format(new Date(item.scheduledAt), "HH:mm", { locale: ptBR })}
                              </div>
                            </>
                          ) : (
                            <span className="colaboradores-empresa-muted">—</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge
                            status={display.toneStatus}
                            type="referral"
                            label={display.label}
                          />
                        </td>
                        <td className="colaboradores-empresa-td-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            disabled={detailLoading && selectedId === item.id}
                            onClick={() => onOpenDetail(item.id)}
                          >
                            {detailLoading && selectedId === item.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Ver detalhes
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {total > pageSize && (
        <div className="colaboradores-empresa-pagination">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={page <= 1 || isPending}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </Button>
          <span className="colaboradores-empresa-pagination-label">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={page >= totalPages || isPending}
            onClick={() => onPageChange(page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </>
  );
}
