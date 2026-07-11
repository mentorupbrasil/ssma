"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Upload,
  Archive,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Shield,
  Paperclip,
  FileWarning,
  FilePenLine,
  FileCheck2,
  CalendarX2,
  SlidersHorizontal,
  ChevronDown,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import type { DocumentDetailSerialized, DocumentListItem } from "@/lib/documents";
import {
  DOCUMENT_KPI_CARDS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_FILTER_OPTIONS,
  LGPD_COMPACT_NOTICE,
  getDocumentDisplayStatus,
  getDocumentLinkedToLabel,
} from "@/lib/documents";
import {
  getDocumentDetail,
  updateDocumentStatus,
  batchArchiveDocuments,
  batchMarkDocumentsAvailable,
} from "@/actions/documents";
import type { DocumentFormOptions } from "@/lib/documents";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { buildFilterChips, removeFilterKey } from "@/lib/filter-chips-utils";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DocumentDetailContent } from "./DocumentDetailContent";
import { DocumentFormDialog } from "./DocumentDialogs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FormOptions = DocumentFormOptions;

const STAT_ICONS: Record<string, LucideIcon> = {
  aguardando_arquivo: FileWarning,
  em_elaboracao: FilePenLine,
  disponiveis: FileCheck2,
  vencidos: CalendarX2,
};

const STAT_TONES: Record<string, "primary" | "warning"> = {
  aguardando_arquivo: "warning",
  em_elaboracao: "primary",
  disponiveis: "primary",
  vencidos: "warning",
};

type DocumentosClientProps = {
  initialItems: DocumentListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  canManage: boolean;
  formOptions: FormOptions;
  filters: Record<string, string | undefined>;
  isEmpresaPortal?: boolean;
};

function ValidityIndicator({ label }: { label: string | null }) {
  if (!label) return null;
  const cls =
    label === "Vencido"
      ? "text-red-600"
      : label === "A vencer"
        ? "text-amber-600"
        : "text-emerald-600";
  return <span className={cn("text-xs font-medium", cls)}>{label}</span>;
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
  const [type, setType] = useState(filters.type ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  const [companyId, setCompanyId] = useState(filters.companyId ?? "");
  const [patientId, setPatientId] = useState(filters.patientId ?? "");
  const [referralId, setReferralId] = useState(filters.referralId ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [validity, setValidity] = useState(filters.validity ?? "");
  const [sensitive, setSensitive] = useState(filters.sensitive ?? "");
  const [sort, setSort] = useState(filters.sort ?? "");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    Boolean(
      filters.patientId ||
        filters.referralId ||
        filters.dateFrom ||
        filters.dateTo ||
        filters.validity ||
        filters.sensitive ||
        filters.sort
    )
  );

  const [formOpen, setFormOpen] = useState(false);
  const [attachMode, setAttachMode] = useState(false);
  const [editDoc, setEditDoc] = useState<DocumentDetailSerialized | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailDoc, setDetailDoc] = useState<DocumentDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  const activeCard = filters.card ?? "";
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
      type: type || undefined,
      status: status || undefined,
      companyId: companyId || undefined,
      patientId: patientId || undefined,
      referralId: referralId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      validity: validity || undefined,
      sensitive: sensitive || undefined,
      sort: sort || undefined,
      ...extra,
    });
  };

  const clearFilters = () => {
    setQ("");
    setType("");
    setStatus("");
    setCompanyId("");
    setPatientId("");
    setReferralId("");
    setDateFrom("");
    setDateTo("");
    setValidity("");
    setSensitive("");
    setSort("");
    setMoreFiltersOpen(false);
    startTransition(() => router.push("/dashboard/documentos"));
  };

  useEffect(() => {
    setQ(filters.q ?? "");
    setType(filters.type ?? "");
    setStatus(filters.status ?? "");
    setCompanyId(filters.companyId ?? "");
    setPatientId(filters.patientId ?? "");
    setReferralId(filters.referralId ?? "");
    setDateFrom(filters.dateFrom ?? "");
    setDateTo(filters.dateTo ?? "");
    setValidity(filters.validity ?? "");
    setSensitive(filters.sensitive ?? "");
    setSort(filters.sort ?? "");
  }, [filters]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.q ||
          filters.type ||
          filters.status ||
          filters.companyId ||
          filters.patientId ||
          filters.referralId ||
          filters.dateFrom ||
          filters.dateTo ||
          filters.validity ||
          filters.sensitive ||
          filters.sort ||
          filters.card
      ),
    [filters]
  );

  const advancedFilterCount = [
    filters.patientId,
    filters.referralId,
    filters.dateFrom,
    filters.dateTo,
    filters.validity,
    filters.sensitive,
    filters.sort,
  ].filter(Boolean).length;

  const activeChips = useMemo(
    () =>
      buildFilterChips([
        { key: "q", value: filters.q, label: (v) => `Busca: ${v}` },
        {
          key: "card",
          value: filters.card,
          label: (v) =>
            DOCUMENT_KPI_CARDS.find((c) => c.filter === v)?.label ?? `Indicador: ${v}`,
          skip: (v) => v === "ALL",
        },
        {
          key: "type",
          value: filters.type,
          label: (v) => `Tipo: ${DOCUMENT_TYPE_LABELS[v as keyof typeof DOCUMENT_TYPE_LABELS] ?? v}`,
        },
        {
          key: "status",
          value: filters.status,
          label: (v) =>
            `Status: ${
              DOCUMENT_STATUS_FILTER_OPTIONS.find((o) => o.value === v)?.label ?? v
            }`,
        },
        {
          key: "companyId",
          value: filters.companyId,
          label: (v) => {
            const company = formOptions.companies.find((c) => c.id === v);
            return `Empresa: ${company ? company.tradeName ?? company.legalName : v}`;
          },
        },
        {
          key: "patientId",
          value: filters.patientId,
          label: (v) =>
            `Colaborador: ${formOptions.patients.find((p) => p.id === v)?.fullName ?? v}`,
        },
        {
          key: "referralId",
          value: filters.referralId,
          label: (v) =>
            `Atendimento: ${formOptions.referrals.find((r) => r.id === v)?.protocol ?? v}`,
        },
        {
          key: "dateFrom",
          value: filters.dateFrom || filters.dateTo,
          label: () =>
            filters.dateFrom && filters.dateTo
              ? `Período: ${filters.dateFrom} – ${filters.dateTo}`
              : filters.dateFrom
                ? `Período desde ${filters.dateFrom}`
                : `Período até ${filters.dateTo}`,
        },
        {
          key: "validity",
          value: filters.validity,
          label: (v) =>
            v === "em_dia"
              ? "Validade: Em dia"
              : v === "a_vencer"
                ? "Validade: A vencer"
                : "Validade: Vencido",
        },
        {
          key: "sensitive",
          value: filters.sensitive,
          label: (v) => (v === "true" ? "Documento sensível" : "Não sensível"),
        },
        {
          key: "sort",
          value: filters.sort,
          label: (v) =>
            v === "validUntil"
              ? "Ordenar: Validade"
              : v === "status"
                ? "Ordenar: Status"
                : v === "company"
                  ? "Ordenar: Empresa"
                  : "Ordenar: Data",
        },
      ]),
    [filters, formOptions]
  );

  const removeChip = (key: string) => {
    if (key === "q") setQ("");
    if (key === "type") setType("");
    if (key === "status") setStatus("");
    if (key === "companyId") setCompanyId("");
    if (key === "patientId") setPatientId("");
    if (key === "referralId") setReferralId("");
    if (key === "validity") setValidity("");
    if (key === "sensitive") setSensitive("");
    if (key === "sort") setSort("");
    if (key === "dateFrom") {
      setDateFrom("");
      setDateTo("");
      updateFilters({ ...removeFilterKey(key, filters), dateTo: undefined });
      return;
    }
    updateFilters(removeFilterKey(key, filters));
  };

  const openDetail = async (id: string) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailDoc(null);
    const result = await getDocumentDetail(id);
    setDetailLoading(false);
    if (!result.success) {
      toast.error(result.error);
      setDrawerOpen(false);
      return;
    }
    setDetailDoc(result.document);
  };

  const handleArchive = async (item: DocumentListItem) => {
    setActionLoading(item.id);
    const result = await updateDocumentStatus(item.id, "ARQUIVADO");
    setActionLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Documento arquivado.");
    router.refresh();
    if (detailDoc?.id === item.id) {
      const refreshed = await getDocumentDetail(item.id);
      if (refreshed.success) setDetailDoc(refreshed.document);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === initialItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(initialItems.map((i) => i.id)));
  };

  const runBatch = async (action: "archive" | "available") => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBatchLoading(true);
    const result =
      action === "archive"
        ? await batchArchiveDocuments(ids)
        : await batchMarkDocumentsAvailable(ids);
    setBatchLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(
      action === "archive"
        ? `${"updated" in result ? result.updated : ids.length} documento(s) arquivado(s).`
        : `${"updated" in result ? result.updated : ids.length} documento(s) marcado(s) como disponível.`
    );
    setSelectedIds(new Set());
    router.refresh();
  };

  const openForm = (attach = false) => {
    setEditDoc(null);
    setAttachMode(attach);
    setFormOpen(true);
  };

  const openEdit = async (id: string) => {
    const result = await getDocumentDetail(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setEditDoc(result.document);
    setAttachMode(false);
    setFormOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("new") === "1" && canManage) openForm(false);
    if (searchParams.get("attach") === "1" && canManage) openForm(true);
  }, [searchParams, canManage]);

  const resultLabel =
    initialTotal === 1
      ? "1 documento encontrado"
      : `${initialTotal} documentos encontrados`;

  return (
    <PageModule className="documentos-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Documentos</h1>
          <p className="colaboradores-empresa-subtitle">
            Gerencie ASOs, laudos, programas ocupacionais e arquivos das empresas.
          </p>
        </div>
        {canManage && (
          <div className="colaboradores-empresa-header-actions">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="brand" size="sm" className="rounded-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar documento
                    <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-80" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openForm(false)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar registro de documento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openForm(true)}>
                  <Paperclip className="mr-2 h-4 w-4" />
                  Anexar arquivo a registro existente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </header>

      <div className="documentos-clinica-lgpd" role="note">
        <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <p>{LGPD_COMPACT_NOTICE}</p>
      </div>

      <div className="colaboradores-empresa-stats documentos-clinica-stats">
        {DOCUMENT_KPI_CARDS.map((card) => {
          const Icon = STAT_ICONS[card.key] ?? FolderOpen;
          const isActive = activeCard === card.filter;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() =>
                updateFilters({ card: isActive ? undefined : card.filter })
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
              placeholder="Buscar por título, empresa, colaborador ou protocolo"
              aria-label="Buscar documentos"
              className="colaboradores-empresa-search-input"
            />
          </div>

          <select
            value={type}
            onChange={(e) => {
              const value = e.target.value;
              setType(value);
              pushCurrentFilters({ type: value || undefined });
            }}
            aria-label="Tipo de documento"
            className="colaboradores-empresa-select"
          >
            <option value="">Tipo de documento</option>
            {Object.entries(DOCUMENT_TYPE_LABELS)
              .filter(([k]) => !["LAUDO", "PROPOSTA", "ENCAMINHAMENTO"].includes(k))
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              const value = e.target.value;
              setStatus(value);
              pushCurrentFilters({ status: value || undefined });
            }}
            aria-label="Status"
            className="colaboradores-empresa-select"
          >
            <option value="">Status</option>
            {DOCUMENT_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

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
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Colaborador"
            >
              <option value="">Colaborador</option>
              {formOptions.patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>

            <select
              value={referralId}
              onChange={(e) => setReferralId(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Atendimento ou protocolo"
            >
              <option value="">Atendimento/protocolo</option>
              {formOptions.referrals.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.protocol}
                  {r.patient?.fullName ? ` · ${r.patient.fullName}` : ""}
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Período de"
              aria-label="Período — início"
              className="h-9 rounded-lg text-sm"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Período até"
              aria-label="Período — fim"
              className="h-9 rounded-lg text-sm"
            />

            <select
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Validade"
            >
              <option value="">Validade</option>
              <option value="em_dia">Em dia</option>
              <option value="a_vencer">A vencer (30 dias)</option>
              <option value="vencido">Vencido</option>
            </select>

            <select
              value={sensitive}
              onChange={(e) => setSensitive(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Documento sensível"
            >
              <option value="">Documento sensível</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>

            <select
              value={sort || "createdAt"}
              onChange={(e) => setSort(e.target.value === "createdAt" ? "" : e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Ordenação"
            >
              <option value="createdAt">Ordenar: Data</option>
              <option value="validUntil">Ordenar: Validade</option>
              <option value="status">Ordenar: Status</option>
              <option value="company">Ordenar: Empresa</option>
            </select>

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
        {isPending && <LoadingState overlay label="Atualizando documentos..." />}

        {canManage && selectedIds.size > 0 && (
          <div className="documentos-clinica-batch">
            <span className="text-sm font-medium text-slate-600">
              {selectedIds.size} selecionado(s)
            </span>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={batchLoading}
              onClick={() => runBatch("available")}
            >
              Marcar disponível
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={batchLoading}
              onClick={() => runBatch("archive")}
            >
              Arquivar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-lg"
              onClick={() => setSelectedIds(new Set())}
            >
              Limpar seleção
            </Button>
          </div>
        )}

        <div className="colaboradores-empresa-result-bar">
          <span className="text-xs text-slate-500">{resultLabel}</span>
        </div>

        {initialItems.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={
              hasActiveFilters
                ? "Nenhum documento encontrado"
                : "Nenhum documento cadastrado"
            }
            description={
              hasActiveFilters
                ? "Ajuste os filtros para localizar documentos."
                : "Cadastre registros e anexe ASOs, laudos e arquivos das empresas."
            }
            action={
              canManage && !hasActiveFilters
                ? { label: "Adicionar documento", onClick: () => openForm(false) }
                : undefined
            }
          />
        ) : (
          <>
            <div className="colaboradores-empresa-table-scroll">
              <table className="colaboradores-empresa-table documentos-clinica-table">
                <thead>
                  <tr>
                    {canManage && (
                      <th className="documentos-clinica-th-check">
                        <input
                          type="checkbox"
                          aria-label="Selecionar todos"
                          checked={
                            initialItems.length > 0 &&
                            selectedIds.size === initialItems.length
                          }
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th>Documento</th>
                    <th>Vinculado a</th>
                    <th>Atendimento</th>
                    <th>Data</th>
                    <th>Validade</th>
                    <th>Status</th>
                    <th>Arquivo</th>
                    <th className="colaboradores-empresa-th-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {initialItems.map((item) => {
                    const display = getDocumentDisplayStatus(item);
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          "documentos-clinica-row cursor-pointer",
                          selectedIds.has(item.id) && "documentos-clinica-row--selected"
                        )}
                        onClick={() => openDetail(item.id)}
                      >
                        {canManage && (
                          <td
                            className="documentos-clinica-td-check"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              aria-label={`Selecionar ${item.title}`}
                              checked={selectedIds.has(item.id)}
                              onChange={() => toggleSelect(item.id)}
                            />
                          </td>
                        )}
                        <td>
                          <div className="documentos-clinica-doc">
                            <div className="documentos-clinica-doc-title">
                              {item.title}
                              {item.sensitive && (
                                <Shield
                                  className="h-3.5 w-3.5 shrink-0 text-violet-500"
                                  aria-label="Sensível"
                                />
                              )}
                            </div>
                            <span className="documentos-clinica-doc-type">
                              {DOCUMENT_TYPE_LABELS[item.type] ?? item.type}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="documentos-clinica-linked">
                            {getDocumentLinkedToLabel(item)}
                          </div>
                        </td>
                        <td className="documentos-clinica-protocol whitespace-nowrap">
                          {item.protocol ?? "—"}
                        </td>
                        <td className="whitespace-nowrap">
                          {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td>
                          {item.validUntil ? (
                            <div className="documentos-clinica-validity">
                              <span>
                                {format(new Date(item.validUntil), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </span>
                              <ValidityIndicator label={item.validityLabel} />
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <StatusBadge
                            status={display.status}
                            type="document"
                            label={display.label}
                          />
                        </td>
                        <td className="whitespace-nowrap">
                          {item.hasFile ? (
                            <span className="documentos-clinica-file documentos-clinica-file--ok">
                              Anexado
                            </span>
                          ) : (
                            <span className="documentos-clinica-file documentos-clinica-file--wait">
                              Sem arquivo
                            </span>
                          )}
                        </td>
                        <td
                          className="colaboradores-empresa-td-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Ações"
                                  disabled={actionLoading === item.id}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetail(item.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              {canManage && (
                                <DropdownMenuItem onClick={() => openEdit(item.id)}>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Anexar ou substituir arquivo
                                </DropdownMenuItem>
                              )}
                              {item.hasFile && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      window.open(`/api/documents/${item.id}/file`, "_blank")
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      window.location.href = `/api/documents/${item.id}/file?action=download`;
                                    }}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar
                                  </DropdownMenuItem>
                                </>
                              )}
                              {canManage && (
                                <>
                                  <DropdownMenuItem onClick={() => openEdit(item.id)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar informações
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleArchive(item)}
                                    disabled={actionLoading === item.id}
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Arquivar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="colaboradores-empresa-mobile-list">
              {initialItems.map((item) => {
                const display = getDocumentDisplayStatus(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="documentos-clinica-mobile-card"
                    onClick={() => openDetail(item.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="documentos-clinica-doc-title">{item.title}</span>
                      <StatusBadge
                        status={display.status}
                        type="document"
                        label={display.label}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {DOCUMENT_TYPE_LABELS[item.type] ?? item.type} ·{" "}
                      {getDocumentLinkedToLabel(item)}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
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
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalhe do documento</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {detailLoading ? (
              <div className="flex justify-center py-12">
                <LoadingState label="Carregando documento..." />
              </div>
            ) : detailDoc ? (
              <>
                <DocumentDetailContent document={detailDoc} />
                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
                  {detailDoc.hasFile && (
                    <>
                      <a
                        href={`/api/documents/${detailDoc.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        <Eye className="mr-2 h-4 w-4" /> Visualizar
                      </a>
                      <a
                        href={`/api/documents/${detailDoc.id}/file?action=download`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        <Download className="mr-2 h-4 w-4" /> Baixar
                      </a>
                    </>
                  )}
                  {canManage && (
                    <Button variant="outline" size="sm" onClick={() => openEdit(detailDoc.id)}>
                      <Upload className="mr-2 h-4 w-4" /> Anexar ou substituir
                    </Button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      {canManage && (
        <DocumentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          document={editDoc}
          formOptions={formOptions}
          attachOnly={attachMode}
          onSuccess={(id) => {
            router.refresh();
            if (id) openDetail(id);
          }}
        />
      )}
    </PageModule>
  );
}
