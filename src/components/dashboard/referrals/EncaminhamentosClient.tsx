"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Calendar,
  RefreshCw,
  MessageCircle,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Inbox,
  Clock3,
  Stethoscope,
  FileWarning,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { ReferralListItem, ReferralDetailSerialized } from "@/lib/referrals";
import {
  REFERRAL_KPI_CARDS,
  REFERRAL_STATUS_TABS,
  buildReferralWhatsAppMessage,
} from "@/lib/referrals";
import { CLINICAL_EXAM_LABELS, REFERRAL_STATUS_LABELS } from "@/types";
import { getReferralDetail } from "@/actions/referrals";
import { PageModule } from "@/components/dashboard/PageModule";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { MobileListCard } from "@/components/dashboard/MobileListCard";
import { buildFilterChips, removeFilterKey } from "@/lib/filter-chips-utils";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReferralEmpresaDetailDialog } from "./ReferralEmpresaDetailDialog";
import { ExamesEmpresaListSection } from "./ExamesEmpresaListSection";
import { ReferralDetailContent } from "./ReferralDetailContent";
import {
  ReferralStatusDialog,
  ReferralScheduleDialog,
  ReferralDocumentDialog,
} from "./ReferralActionDialogs";
import { EMPRESA_EXAMES_STATUS_FILTER_OPTIONS } from "@/lib/empresa-portal";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };
type ResponsibleOption = { id: string; name: string };

const STAT_ICONS: Record<string, LucideIcon> = {
  novos: Inbox,
  aguardando_agendamento: Clock3,
  em_atendimento: Stethoscope,
  pendencias: FileWarning,
};

const STAT_TONES: Record<string, "primary" | "warning"> = {
  novos: "primary",
  aguardando_agendamento: "warning",
  em_atendimento: "primary",
  pendencias: "warning",
};

type EncaminhamentosClientProps = {
  initialItems: ReferralListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statusCounts: Record<string, number>;
  companies: CompanyOption[];
  responsibles?: ResponsibleOption[];
  isEmpresa: boolean;
  canManage: boolean;
  embedded?: boolean;
  listPath?: string;
  filters: {
    q?: string;
    status?: string;
    companyId?: string;
    clinicalExamType?: string;
    dateFrom?: string;
    dateTo?: string;
    assignedToId?: string;
    scheduledFrom?: string;
    scheduledTo?: string;
    pending?: string;
    documentSituation?: string;
  };
};

function formatScheduleLabel(scheduledAt: string | null) {
  if (!scheduledAt) return "Não agendado";
  return format(new Date(scheduledAt), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function EncaminhamentosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statusCounts,
  companies,
  responsibles = [],
  isEmpresa,
  canManage,
  embedded = false,
  listPath: listPathProp,
  filters,
}: EncaminhamentosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const listPath = listPathProp ?? "/dashboard/encaminhamentos";

  const [q, setQ] = useState(filters.q ?? "");
  const [companyId, setCompanyId] = useState(filters.companyId ?? "");
  const [clinicalExamType, setClinicalExamType] = useState(filters.clinicalExamType ?? "");
  const [statusFilter, setStatusFilter] = useState(filters.status ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [assignedToId, setAssignedToId] = useState(filters.assignedToId ?? "");
  const [scheduledFrom, setScheduledFrom] = useState(filters.scheduledFrom ?? "");
  const [scheduledTo, setScheduledTo] = useState(filters.scheduledTo ?? "");
  const [pending, setPending] = useState(filters.pending ?? "");
  const [documentSituation, setDocumentSituation] = useState(filters.documentSituation ?? "");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    Boolean(
      filters.assignedToId ||
        filters.dateFrom ||
        filters.dateTo ||
        filters.scheduledFrom ||
        filters.scheduledTo ||
        filters.pending ||
        filters.documentSituation
    )
  );

  const activeStatus = filters.status ?? "";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReferralDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!("page" in updates)) params.delete("page");
      params.delete("tab");
      startTransition(() => {
        router.push(`${listPath}?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams, listPath]
  );

  const pushCurrentFilters = (extra?: Record<string, string | undefined>) => {
    updateFilters({
      q: q || undefined,
      companyId: companyId || undefined,
      clinicalExamType: clinicalExamType || undefined,
      status: statusFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      assignedToId: assignedToId || undefined,
      scheduledFrom: scheduledFrom || undefined,
      scheduledTo: scheduledTo || undefined,
      pending: pending || undefined,
      documentSituation: documentSituation || undefined,
      ...extra,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCompanyId("");
    setClinicalExamType("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setAssignedToId("");
    setScheduledFrom("");
    setScheduledTo("");
    setPending("");
    setDocumentSituation("");
    setMoreFiltersOpen(false);
    startTransition(() => {
      router.push(listPath, { scroll: false });
    });
  };

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.q ||
          filters.status ||
          filters.companyId ||
          filters.clinicalExamType ||
          filters.dateFrom ||
          filters.dateTo ||
          filters.assignedToId ||
          filters.scheduledFrom ||
          filters.scheduledTo ||
          filters.pending ||
          filters.documentSituation
      ),
    [filters]
  );

  const advancedFilterCount = [
    filters.assignedToId,
    filters.dateFrom,
    filters.dateTo,
    filters.scheduledFrom,
    filters.scheduledTo,
    filters.pending,
    filters.documentSituation,
  ].filter(Boolean).length;

  const activeChips = useMemo(
    () =>
      buildFilterChips([
        { key: "q", value: filters.q, label: (v) => `Busca: ${v}` },
        {
          key: "status",
          value: filters.status,
          label: (v) => {
            const kpi = REFERRAL_KPI_CARDS.find((c) => c.filter === v);
            if (kpi) return kpi.label;
            const tab = REFERRAL_STATUS_TABS.find((t) => t.value === v);
            if (tab) return `Status: ${tab.label}`;
            if (v === "PENDENCIAS") return "Com pendências";
            return (
              EMPRESA_EXAMES_STATUS_FILTER_OPTIONS.find((o) => o.value === v)?.label ??
              `Status: ${v}`
            );
          },
          skip: (v) => v === "ALL",
        },
        {
          key: "companyId",
          value: filters.companyId,
          label: (v) => `Empresa: ${companies.find((c) => c.id === v)?.name ?? v}`,
          skip: () => isEmpresa,
        },
        {
          key: "clinicalExamType",
          value: filters.clinicalExamType,
          label: (v) =>
            `Exame: ${CLINICAL_EXAM_LABELS[v as keyof typeof CLINICAL_EXAM_LABELS] ?? v}`,
        },
        {
          key: "assignedToId",
          value: filters.assignedToId,
          label: (v) =>
            `Responsável: ${responsibles.find((r) => r.id === v)?.name ?? v}`,
        },
        {
          key: "dateFrom",
          value: filters.dateFrom || filters.dateTo,
          label: () =>
            filters.dateFrom && filters.dateTo
              ? `Solicitação: ${filters.dateFrom} – ${filters.dateTo}`
              : filters.dateFrom
                ? `Solicitação desde ${filters.dateFrom}`
                : `Solicitação até ${filters.dateTo}`,
        },
        {
          key: "scheduledFrom",
          value: filters.scheduledFrom || filters.scheduledTo,
          label: () =>
            filters.scheduledFrom && filters.scheduledTo
              ? `Agendamento: ${filters.scheduledFrom} – ${filters.scheduledTo}`
              : filters.scheduledFrom
                ? `Agendamento desde ${filters.scheduledFrom}`
                : `Agendamento até ${filters.scheduledTo}`,
        },
        {
          key: "pending",
          value: filters.pending,
          label: () => "Com pendência",
        },
        {
          key: "documentSituation",
          value: filters.documentSituation,
          label: (v) =>
            `Documento: ${REFERRAL_STATUS_LABELS[v as keyof typeof REFERRAL_STATUS_LABELS] ?? v}`,
        },
      ]),
    [filters, companies, responsibles, isEmpresa]
  );

  const removeChip = (key: string) => {
    if (key === "q") setQ("");
    if (key === "companyId") setCompanyId("");
    if (key === "clinicalExamType") setClinicalExamType("");
    if (key === "status") setStatusFilter("");
    if (key === "assignedToId") setAssignedToId("");
    if (key === "pending") setPending("");
    if (key === "documentSituation") setDocumentSituation("");
    if (key === "dateFrom") {
      setDateFrom("");
      setDateTo("");
      updateFilters({ ...removeFilterKey(key, filters), dateTo: undefined });
      return;
    }
    if (key === "scheduledFrom") {
      setScheduledFrom("");
      setScheduledTo("");
      updateFilters({
        ...removeFilterKey(key, filters),
        scheduledTo: undefined,
      });
      return;
    }
    updateFilters(removeFilterKey(key, filters));
  };

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    const result = await getReferralDetail(id);
    setDetailLoading(false);
    if (result.success) {
      setDetail(result.referral);
    } else {
      setDetailError(result.error);
      setDetail(null);
    }
  }, []);

  const openDetail = (id: string) => {
    setSelectedId(id);
    loadDetail(id);
  };

  const refreshDetail = () => {
    if (selectedId) loadDetail(selectedId);
    router.refresh();
  };

  useEffect(() => {
    setQ(filters.q ?? "");
    setCompanyId(filters.companyId ?? "");
    setClinicalExamType(filters.clinicalExamType ?? "");
    setStatusFilter(filters.status ?? "");
    setDateFrom(filters.dateFrom ?? "");
    setDateTo(filters.dateTo ?? "");
    setAssignedToId(filters.assignedToId ?? "");
    setScheduledFrom(filters.scheduledFrom ?? "");
    setScheduledTo(filters.scheduledTo ?? "");
    setPending(filters.pending ?? "");
    setDocumentSituation(filters.documentSituation ?? "");
  }, [filters]);

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl && idFromUrl !== selectedId) {
      openDetail(idFromUrl);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const getWhatsAppUrl = (item: ReferralListItem) => {
    const phone = item.companyWhatsapp ?? item.companyPhone;
    if (!phone) return null;
    const message = buildReferralWhatsAppMessage({
      protocol: item.protocol,
      companyName: item.companyName,
      employeeName: item.employeeName,
      clinicalExamType: item.clinicalExamType,
      status: item.status,
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
    });
    return `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  };

  const resultLabel =
    initialTotal === 1
      ? "1 atendimento encontrado"
      : `${initialTotal} atendimentos encontrados`;

  const clinicBody = (
    <>
      {!embedded && (
        <header className="colaboradores-empresa-header">
          <div className="colaboradores-empresa-header-copy">
            <h1 className="colaboradores-empresa-title">Atendimentos</h1>
            <p className="colaboradores-empresa-subtitle">
              Gerencie exames ocupacionais, agendamentos e andamento dos atendimentos.
            </p>
          </div>
          <div className="colaboradores-empresa-header-actions">
            <Link href="/dashboard/pre-encaminhamentos">
              <Button variant="outline" size="sm" className="rounded-lg">
                Solicitações recebidas
              </Button>
            </Link>
            {canManage && (
              <Link href="/dashboard/encaminhamentos/novo">
                <Button variant="brand" size="sm" className="rounded-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar atendimento
                </Button>
              </Link>
            )}
          </div>
        </header>
      )}

      <div className="colaboradores-empresa-stats atendimentos-clinica-stats">
        {REFERRAL_KPI_CARDS.map((card) => {
          const Icon = STAT_ICONS[card.key] ?? FileText;
          const isActive = activeStatus === card.filter;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() =>
                updateFilters({
                  status: isActive ? undefined : card.filter,
                  pending: undefined,
                  documentSituation: undefined,
                })
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
                  {statusCounts[card.key] ?? 0}
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
              placeholder="Buscar por protocolo, empresa, colaborador ou CPF"
              aria-label="Buscar atendimentos"
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
            aria-label="Filtrar por empresa"
            className="colaboradores-empresa-select"
          >
            <option value="">Empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={
              REFERRAL_STATUS_TABS.some((t) => t.value === statusFilter && t.value !== "ALL")
                ? statusFilter
                : ""
            }
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value);
              setPending("");
              setDocumentSituation("");
              pushCurrentFilters({
                status: value || undefined,
                pending: undefined,
                documentSituation: undefined,
              });
            }}
            aria-label="Filtrar por status"
            className="colaboradores-empresa-select"
          >
            <option value="">Status</option>
            {REFERRAL_STATUS_TABS.filter((t) => t.value !== "ALL").map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>

          <select
            value={clinicalExamType}
            onChange={(e) => {
              const value = e.target.value;
              setClinicalExamType(value);
              pushCurrentFilters({ clinicalExamType: value || undefined });
            }}
            aria-label="Tipo de exame"
            className="colaboradores-empresa-select"
          >
            <option value="">Tipo de exame</option>
            {Object.entries(CLINICAL_EXAM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Responsável"
            >
              <option value="">Responsável</option>
              {responsibles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Solicitação de"
              aria-label="Período da solicitação — início"
              className="h-9 rounded-lg text-sm"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Solicitação até"
              aria-label="Período da solicitação — fim"
              className="h-9 rounded-lg text-sm"
            />

            <Input
              type="date"
              value={scheduledFrom}
              onChange={(e) => setScheduledFrom(e.target.value)}
              title="Agendamento de"
              aria-label="Data do agendamento — início"
              className="h-9 rounded-lg text-sm"
            />
            <Input
              type="date"
              value={scheduledTo}
              onChange={(e) => setScheduledTo(e.target.value)}
              title="Agendamento até"
              aria-label="Data do agendamento — fim"
              className="h-9 rounded-lg text-sm"
            />

            <select
              value={pending}
              onChange={(e) => setPending(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Pendência"
            >
              <option value="">Pendência</option>
              <option value="true">Com pendência</option>
            </select>

            <select
              value={documentSituation}
              onChange={(e) => setDocumentSituation(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Situação do documento"
            >
              <option value="">Situação do documento</option>
              <option value="AGUARDANDO_RESULTADO">Aguardando resultado</option>
              <option value="AGUARDANDO_DOCUMENTO">Aguardando documento</option>
              <option value="ASO_DISPONIVEL">ASO disponível</option>
            </select>

            <Button
              type="button"
              variant="brand"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                const nextStatus =
                  documentSituation ||
                  (pending === "true" ? "PENDENCIAS" : statusFilter || undefined);
                pushCurrentFilters({
                  status: nextStatus,
                  pending: documentSituation ? undefined : pending || undefined,
                  documentSituation: documentSituation || undefined,
                });
              }}
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
        {isPending && <LoadingState overlay label="Atualizando atendimentos..." />}

        <div className="colaboradores-empresa-result-bar">
          <span className="text-xs text-slate-500">{resultLabel}</span>
        </div>

        {initialItems.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum atendimento encontrado"
            description="Crie um atendimento ou ajuste os filtros."
            action={
              canManage
                ? { label: "Criar atendimento", href: "/dashboard/encaminhamentos/novo" }
                : undefined
            }
          />
        ) : (
          <>
            <div className="colaboradores-empresa-table-scroll hidden md:block">
              <table className="colaboradores-empresa-table atendimentos-clinica-table">
                <thead>
                  <tr>
                    <th>Protocolo</th>
                    <th>Colaborador</th>
                    <th>Empresa</th>
                    <th>Atendimento</th>
                    <th>Agendamento</th>
                    <th>Status</th>
                    <th>Responsável</th>
                    <th className="colaboradores-empresa-th-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {initialItems.map((item) => {
                    const waUrl = getWhatsAppUrl(item);
                    return (
                      <tr
                        key={item.id}
                        className="atendimentos-clinica-row cursor-pointer"
                        onClick={() => openDetail(item.id)}
                      >
                        <td className="atendimentos-clinica-protocol">
                          <Link
                            href={`/dashboard/encaminhamentos?id=${item.id}`}
                            className="atendimentos-clinica-link"
                            onClick={(e) => {
                              e.preventDefault();
                              openDetail(item.id);
                            }}
                          >
                            {item.protocol}
                          </Link>
                        </td>
                        <td>
                          <div className="atendimentos-clinica-stack">
                            <Link
                              href={`/dashboard/colaboradores/${item.patientId}`}
                              className="atendimentos-clinica-link atendimentos-clinica-primary-text"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.employeeName}
                            </Link>
                            <span className="atendimentos-clinica-meta">
                              {item.jobTitle ?? "Sem função"}
                            </span>
                            <span className="atendimentos-clinica-cpf">{item.employeeCpf}</span>
                          </div>
                        </td>
                        <td>
                          <Link
                            href={`/dashboard/empresas/${item.companyId}`}
                            className="atendimentos-clinica-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.companyName}
                          </Link>
                        </td>
                        <td>
                          <div className="atendimentos-clinica-stack">
                            <span className="atendimentos-clinica-primary-text">
                              {CLINICAL_EXAM_LABELS[item.clinicalExamType]}
                            </span>
                            <span className="atendimentos-clinica-meta">
                              {format(new Date(item.requestedDate), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="atendimentos-clinica-schedule whitespace-nowrap">
                          {formatScheduleLabel(item.scheduledAt)}
                        </td>
                        <td>
                          <StatusBadge status={item.status} type="referral" />
                        </td>
                        <td className="whitespace-nowrap">
                          {item.responsibleName ?? "—"}
                        </td>
                        <td
                          className="colaboradores-empresa-td-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon-sm" aria-label="Ações">
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
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      openDetail(item.id);
                                      setScheduleDialogOpen(true);
                                    }}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Agendar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      openDetail(item.id);
                                      setStatusDialogOpen(true);
                                    }}
                                  >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Alterar status
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      openDetail(item.id);
                                      setDocumentDialogOpen(true);
                                    }}
                                  >
                                    <Paperclip className="mr-2 h-4 w-4" />
                                    Anexar documento
                                  </DropdownMenuItem>
                                </>
                              )}
                              {waUrl && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(waUrl, "_blank", "noopener,noreferrer")
                                  }
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Enviar WhatsApp
                                </DropdownMenuItem>
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

            <div className="colaboradores-empresa-mobile-list md:hidden">
              {initialItems.map((item) => (
                <MobileListCard
                  key={item.id}
                  icon={FileText}
                  title={item.protocol}
                  subtitle={`${item.employeeName} · ${item.companyName}`}
                  meta={CLINICAL_EXAM_LABELS[item.clinicalExamType]}
                  badge={<StatusBadge status={item.status} type="referral" />}
                  onClick={() => openDetail(item.id)}
                />
              ))}
            </div>
          </>
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
    </>
  );

  const empresaBody = (
    <ExamesEmpresaListSection
      items={initialItems}
      total={initialTotal}
      page={initialPage}
      pageSize={pageSize}
      isPending={isPending}
      filters={filters}
      onSearch={(values) =>
        updateFilters({
          q: values.q.trim() || undefined,
          status: values.status || undefined,
          clinicalExamType: values.clinicalExamType || undefined,
          dateFrom: values.dateFrom || undefined,
          dateTo: values.dateTo || undefined,
        })
      }
      onClear={clearFilters}
      onPageChange={(nextPage) => updateFilters({ page: String(nextPage) })}
      onOpenDetail={openDetail}
      detailLoading={detailLoading}
      selectedId={selectedId}
      activeChips={activeChips}
      onRemoveChip={removeChip}
    />
  );

  const body = (
    <>
      {isEmpresa ? empresaBody : clinicBody}

      {isEmpresa ? (
        <ReferralEmpresaDetailDialog
          referral={detail}
          open={!!selectedId}
          loading={detailLoading}
          error={detailError}
          onOpenChange={(open) => !open && setSelectedId(null)}
          onRetry={() => selectedId && loadDetail(selectedId)}
        />
      ) : (
        <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent
            side="right"
            className="referral-detail-sheet w-full overflow-y-auto sm:max-w-2xl lg:max-w-3xl"
          >
            <SheetHeader className="border-b pb-4">
              <SheetTitle>{detail?.protocol ?? "Atendimento"}</SheetTitle>
              <SheetDescription>
                {detail
                  ? `${detail.company.tradeName ?? detail.company.legalName} · ${detail.employee.fullName}`
                  : "Carregando detalhes..."}
              </SheetDescription>
            </SheetHeader>

            {detailLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
              </div>
            )}

            {detailError && (
              <div className="referral-error-state">
                <p>{detailError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedId && loadDetail(selectedId)}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {detail && !detailLoading && (
              <ReferralDetailContent
                referral={detail}
                canManage={canManage}
                onRefresh={refreshDetail}
                onOpenStatus={() => setStatusDialogOpen(true)}
                onOpenSchedule={() => setScheduleDialogOpen(true)}
                onOpenDocument={() => setDocumentDialogOpen(true)}
              />
            )}
          </SheetContent>
        </Sheet>
      )}

      {!isEmpresa && selectedId && detail && (
        <>
          <ReferralStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            referralId={selectedId}
            currentStatus={detail.status}
            onSuccess={refreshDetail}
          />
          <ReferralScheduleDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            referralId={selectedId}
            onSuccess={refreshDetail}
          />
          <ReferralDocumentDialog
            open={documentDialogOpen}
            onOpenChange={setDocumentDialogOpen}
            referralId={selectedId}
            onSuccess={refreshDetail}
          />
        </>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <PageModule className={isEmpresa ? undefined : "atendimentos-clinica"}>{body}</PageModule>
  );
}
