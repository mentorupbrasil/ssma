"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Building,
  FileWarning,
  ClipboardList,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { CompanyListItem } from "@/lib/companies";
import {
  COMPANY_STAT_CARDS,
  formatCompanyPendingLabel,
} from "@/lib/companies";
import { PageModule } from "@/components/dashboard/PageModule";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { buildFilterChips, removeFilterKey } from "@/lib/filter-chips-utils";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewCompanyDialog } from "./CompanyDialogs";
import { CompanyActionMenu } from "./CompanyActionMenu";
import { formatCNPJ, formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";

const STAT_ICONS: Record<string, LucideIcon> = {
  ativas: Building2,
  inativas: Building,
  com_pendencias: FileWarning,
  atendimentos_abertos: ClipboardList,
};

const STAT_TONES: Record<string, "primary" | "warning"> = {
  ativas: "primary",
  inativas: "primary",
  com_pendencias: "warning",
  atendimentos_abertos: "primary",
};

type EmpresasClientProps = {
  initialItems: CompanyListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  cities: string[];
  canManage: boolean;
  canCommercial: boolean;
  filters: {
    q?: string;
    status?: string;
    city?: string;
    size?: string;
    contractType?: string;
    pending?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

export function EmpresasClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  cities,
  canManage,
  canCommercial,
  filters,
}: EmpresasClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [city, setCity] = useState(filters.city ?? "");
  const [size, setSize] = useState(filters.size ?? "");
  const [contractType, setContractType] = useState(filters.contractType ?? "");
  const [pending, setPending] = useState(filters.pending ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    Boolean(filters.size || filters.contractType || filters.pending || filters.dateFrom || filters.dateTo)
  );
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const activeStatus = filters.status ?? "";
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
        router.push(`/dashboard/empresas?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const pushCurrentFilters = (extra?: Record<string, string | undefined>) => {
    updateFilters({
      q: q || undefined,
      city: city || undefined,
      size: size || undefined,
      contractType: contractType || undefined,
      pending: pending || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: activeStatus || undefined,
      ...extra,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCity("");
    setSize("");
    setContractType("");
    setPending("");
    setDateFrom("");
    setDateTo("");
    setMoreFiltersOpen(false);
    startTransition(() => router.push("/dashboard/empresas"));
  };

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.q ||
          filters.status ||
          filters.city ||
          filters.size ||
          filters.contractType ||
          filters.pending ||
          filters.dateFrom ||
          filters.dateTo
      ),
    [filters]
  );

  const advancedFilterCount = [
    filters.size,
    filters.contractType,
    filters.pending,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const activeChips = useMemo(
    () =>
      buildFilterChips([
        { key: "q", value: filters.q, label: (v) => `Busca: ${v}` },
        {
          key: "status",
          value: filters.status,
          label: (v) => {
            const card = COMPANY_STAT_CARDS.find((c) => c.filter === v);
            if (card) return card.label;
            if (v === "ATIVA") return "Status: Ativa";
            if (v === "INATIVA") return "Status: Inativa";
            if (v === "PENDENTE") return "Status: Pendente";
            if (v === "BLOQUEADA") return "Status: Bloqueada";
            return `Status: ${v}`;
          },
          skip: (v) => v === "ALL",
        },
        { key: "city", value: filters.city, label: (v) => `Cidade: ${v}` },
        { key: "size", value: filters.size, label: (v) => `Porte: ${v}` },
        { key: "contractType", value: filters.contractType, label: (v) => `Contrato: ${v}` },
        { key: "pending", value: filters.pending, label: () => "Com pendência" },
        { key: "dateFrom", value: filters.dateFrom, label: (v) => `De ${v}` },
        { key: "dateTo", value: filters.dateTo, label: (v) => `Até ${v}` },
      ]),
    [filters]
  );

  const removeChip = (key: string) => {
    const next = removeFilterKey(key, filters);
    if (key === "q") setQ("");
    if (key === "city") setCity("");
    if (key === "size") setSize("");
    if (key === "contractType") setContractType("");
    if (key === "pending") setPending("");
    if (key === "dateFrom") setDateFrom("");
    if (key === "dateTo") setDateTo("");
    updateFilters(next);
  };

  useEffect(() => {
    if (searchParams.get("new") === "1" && canManage) {
      setNewDialogOpen(true);
    }
  }, [searchParams, canManage]);

  const resultLabel =
    initialTotal === 1 ? "1 empresa encontrada" : `${initialTotal} empresas encontradas`;

  return (
    <PageModule className="empresas-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Empresas</h1>
          <p className="colaboradores-empresa-subtitle">
            Gerencie empresas clientes, responsáveis e atendimentos.
          </p>
        </div>
        {canManage && (
          <div className="colaboradores-empresa-header-actions">
            <Button variant="brand" size="sm" className="rounded-lg" onClick={() => setNewDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova empresa
            </Button>
          </div>
        )}
      </header>

      <div className="colaboradores-empresa-stats empresas-clinica-stats">
        {COMPANY_STAT_CARDS.map((card) => {
          const Icon = STAT_ICONS[card.key] ?? Building2;
          const isActive = activeStatus === card.filter;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() =>
                updateFilters({ status: isActive ? undefined : card.filter })
              }
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

      <div className="colaboradores-empresa-filters">
        <div className="colaboradores-empresa-filters-row">
          <div className="colaboradores-empresa-search">
            <Search className="colaboradores-empresa-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pushCurrentFilters()}
              placeholder="Buscar por razão social, fantasia, CNPJ, responsável ou telefone"
              aria-label="Buscar empresas"
              className="colaboradores-empresa-search-input"
            />
          </div>

          <select
            value={
              activeStatus === "ATIVA" ||
              activeStatus === "INATIVA" ||
              activeStatus === "PENDENTE" ||
              activeStatus === "BLOQUEADA"
                ? activeStatus
                : ""
            }
            onChange={(e) => {
              const value = e.target.value;
              updateFilters({ status: value || undefined });
            }}
            aria-label="Filtrar por status"
            className="colaboradores-empresa-select"
          >
            <option value="">Status</option>
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
            <option value="PENDENTE">Pendente</option>
            <option value="BLOQUEADA">Bloqueada</option>
          </select>

          <select
            value={city}
            onChange={(e) => {
              const value = e.target.value;
              setCity(value);
              pushCurrentFilters({ city: value || undefined });
            }}
            aria-label="Filtrar por cidade"
            className="colaboradores-empresa-select"
          >
            <option value="">Cidade</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
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
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {moreFiltersOpen && (
          <div className="colaboradores-empresa-filters-advanced">
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Porte"
            >
              <option value="">Porte</option>
              <option value="PEQUENA">Pequena</option>
              <option value="MEDIA">Média</option>
              <option value="GRANDE">Grande</option>
            </select>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Tipo de contrato"
            >
              <option value="">Contrato</option>
              <option value="AVULSO">Avulso</option>
              <option value="MENSAL">Mensal</option>
              <option value="ANUAL">Anual</option>
              <option value="EM_NEGOCIACAO">Em negociação</option>
            </select>
            <select
              value={pending}
              onChange={(e) => setPending(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Pendências"
            >
              <option value="">Pendências</option>
              <option value="true">Com pendência</option>
            </select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Cadastro de"
              className="h-9 rounded-lg text-sm"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Cadastro até"
              className="h-9 rounded-lg text-sm"
            />
            <Button
              type="button"
              variant="brand"
              size="sm"
              className="rounded-lg"
              onClick={() => pushCurrentFilters()}
            >
              Aplicar
            </Button>
          </div>
        )}

        {activeChips.length > 0 && (
          <div className="colaboradores-empresa-chips">
            <FilterChips chips={activeChips} onRemove={removeChip} onClearAll={clearFilters} />
          </div>
        )}
      </div>

      <div className="colaboradores-empresa-table-wrap relative">
        {isPending && <LoadingState overlay label="Atualizando empresas..." />}

        <div className="colaboradores-empresa-result-bar">
          <span className="text-xs text-slate-500">{resultLabel}</span>
        </div>

        {initialItems.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhuma empresa encontrada"
            description="Cadastre a primeira empresa ou ajuste os filtros."
            action={
              canManage
                ? { label: "Nova empresa", onClick: () => setNewDialogOpen(true) }
                : undefined
            }
          />
        ) : (
          <div className="colaboradores-empresa-table-scroll">
            <table className="colaboradores-empresa-table empresas-clinica-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>CNPJ</th>
                  <th>Responsável</th>
                  <th>Cidade/UF</th>
                  <th className="text-center">Colaboradores</th>
                  <th className="text-center">Atendimentos</th>
                  <th>Pendências</th>
                  <th>Status</th>
                  <th className="colaboradores-empresa-th-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {initialItems.map((c) => (
                  <tr
                    key={c.id}
                    className="empresas-clinica-row cursor-pointer"
                    onClick={() => router.push(`/dashboard/empresas/${c.id}`)}
                  >
                    <td>
                      <div className="colaboradores-empresa-name-cell">
                        <p className="colaboradores-empresa-name">{c.legalName}</p>
                        {c.tradeName ? (
                          <p className="colaboradores-empresa-muted">{c.tradeName}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="empresas-clinica-cnpj">{formatCNPJ(c.cnpj)}</td>
                    <td>
                      <p className="text-sm">{c.responsibleName ?? "—"}</p>
                      <p className="colaboradores-empresa-muted empresas-clinica-phone">
                        {c.whatsapp ? formatPhone(c.whatsapp) : "—"}
                      </p>
                    </td>
                    <td className="text-sm">
                      {[c.city, c.state].filter(Boolean).join("/") || "—"}
                    </td>
                    <td className="text-center text-sm">{c.employeeCount}</td>
                    <td className="text-center text-sm">
                      {c.openReferrals > 0 ? (
                        <button
                          type="button"
                          className="empresas-clinica-link-count"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/encaminhamentos?companyId=${c.id}`
                            );
                          }}
                        >
                          {c.openReferrals}
                        </button>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={cn(
                          "empresas-clinica-pending",
                          c.pendingCount > 0
                            ? "empresas-clinica-pending--alert"
                            : "empresas-clinica-pending--ok"
                        )}
                      >
                        {formatCompanyPendingLabel(c.pendingCount)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} type="company" />
                    </td>
                    <td
                      className="colaboradores-empresa-td-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CompanyActionMenu
                        onViewDetails={() => router.push(`/dashboard/empresas/${c.id}`)}
                        onNewQuote={
                          canManage && canCommercial
                            ? () => router.push(`/dashboard/orcamentos?companyId=${c.id}`)
                            : undefined
                        }
                        onManagePortal={() =>
                          router.push(`/dashboard/empresas/${c.id}?tab=portal`)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="colaboradores-empresa-pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={initialPage <= 1 || isPending}
              onClick={() =>
                updateFilters({
                  page: String(initialPage - 1),
                  status: activeStatus || undefined,
                })
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-500">
              Página {initialPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={initialPage >= totalPages || isPending}
              onClick={() =>
                updateFilters({
                  page: String(initialPage + 1),
                  status: activeStatus || undefined,
                })
              }
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      <NewCompanyDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={(id) => {
          router.push(`/dashboard/empresas/${id}`);
          router.refresh();
        }}
      />
    </PageModule>
  );
}
