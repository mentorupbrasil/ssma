"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Inbox,
  CheckCircle2,
  Stethoscope,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import type { ReferralListItem, ReferralDetailSerialized } from "@/lib/referrals";
import {
  REFERRAL_KPI_CARDS,
  CLINIC_STATUS_FILTER_OPTIONS,
  REFERRAL_SOURCE_SHORT_LABELS,
  getClinicReferralStatusLabel,
} from "@/lib/referrals";
import { CLINICAL_EXAM_LABELS } from "@/types";
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
import { ReferralEmpresaDetailDialog } from "./ReferralEmpresaDetailDialog";
import { ExamesEmpresaListSection } from "./ExamesEmpresaListSection";
import { ReferralStatusDialog } from "./ReferralActionDialogs";
import { ReferralStatusMenu } from "./ReferralStatusMenu";
import { EMPRESA_EXAMES_STATUS_FILTER_OPTIONS } from "@/lib/empresa-portal";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };
type ResponsibleOption = { id: string; name: string };

const STAT_ICONS: Record<string, LucideIcon> = {
  recebidos: Inbox,
  agendados: CheckCircle2,
  em_atendimento: Stethoscope,
  concluidos: ClipboardCheck,
};

const STAT_TONES: Record<string, "primary" | "warning"> = {
  recebidos: "warning",
  agendados: "primary",
  em_atendimento: "primary",
  concluidos: "primary",
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

export function EncaminhamentosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statusCounts,
  companies,
  responsibles: _responsibles = [],
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

  const activeStatus = filters.status ?? "";

  const [statusTarget, setStatusTarget] = useState<ReferralListItem | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReferralDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

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
      ...extra,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCompanyId("");
    setClinicalExamType("");
    setStatusFilter("");
    startTransition(() => {
      router.push(listPath, { scroll: false });
    });
  };

  const hasActiveFilters = useMemo(
    () =>
      Boolean(filters.q || filters.status || filters.companyId || filters.clinicalExamType),
    [filters]
  );

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
            return (
              CLINIC_STATUS_FILTER_OPTIONS.find((o) => o.value === v)?.label ??
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
      ]),
    [filters, companies, isEmpresa]
  );

  const removeChip = (key: string) => {
    if (key === "q") setQ("");
    if (key === "companyId") setCompanyId("");
    if (key === "clinicalExamType") setClinicalExamType("");
    if (key === "status") setStatusFilter("");
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

  const openCancelDialog = (item: ReferralListItem) => {
    setStatusTarget(item);
    setStatusDialogOpen(true);
  };

  const refreshAfterStatus = () => {
    setStatusTarget(null);
    router.refresh();
  };

  useEffect(() => {
    setQ(filters.q ?? "");
    setCompanyId(filters.companyId ?? "");
    setClinicalExamType(filters.clinicalExamType ?? "");
    setStatusFilter(filters.status ?? "");
  }, [filters]);

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl && isEmpresa && idFromUrl !== selectedId) {
      openDetail(idFromUrl);
    }
  }, [searchParams, isEmpresa]); // eslint-disable-line react-hooks/exhaustive-deps

  const resultLabel =
    initialTotal === 1
      ? "1 registro na fila"
      : `${initialTotal} registros na fila`;

  const clinicBody = (
    <>
      {!embedded && (
        <header className="sys-page-header">
          <div>
            <h1 className="sys-page-title">Fila de atendimentos</h1>
            <p className="sys-page-subtitle">
              Pedidos recebidos do portal RH e do site. Confirme, atenda e conclua — o ASO é
              liberado em Documentos.
            </p>
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

      <div className="sys-toolbar colaboradores-empresa-filters">
        <div className="colaboradores-empresa-filters-row">
          <div className="colaboradores-empresa-search">
            <Search className="colaboradores-empresa-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pushCurrentFilters()}
              placeholder="Protocolo, empresa, colaborador ou CPF"
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
              CLINIC_STATUS_FILTER_OPTIONS.some((o) => o.value === statusFilter)
                ? statusFilter
                : ""
            }
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value);
              pushCurrentFilters({ status: value || undefined });
            }}
            aria-label="Filtrar por status"
            className="colaboradores-empresa-select"
          >
            <option value="">Status</option>
            {CLINIC_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
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

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="colaboradores-empresa-clear-btn rounded-md"
              onClick={clearFilters}
            >
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
            icon={FileText}
            title="Nenhum pedido na fila"
            description="Quando o RH ou o site enviarem um encaminhamento, ele aparece aqui."
          />
        ) : (
          <>
            <div className="colaboradores-empresa-table-scroll hidden md:block">
              <table className="colaboradores-empresa-table atendimentos-clinica-table sys-data-table">
                <thead>
                  <tr>
                    <th>Origem</th>
                    <th>Colaborador</th>
                    <th>Empresa</th>
                    <th>Exame</th>
                    <th>Recebido em</th>
                    <th>Status</th>
                    {canManage && <th className="colaboradores-empresa-th-actions">Ação</th>}
                  </tr>
                </thead>
                <tbody>
                  {initialItems.map((item) => (
                    <tr key={item.id} className="atendimentos-clinica-row">
                      <td>
                        <span
                          className={cn(
                            "sys-origin-badge",
                            `sys-origin-badge--${item.source.toLowerCase()}`
                          )}
                          title={REFERRAL_SOURCE_SHORT_LABELS[item.source]}
                        >
                          {REFERRAL_SOURCE_SHORT_LABELS[item.source]}
                        </span>
                      </td>
                      <td>
                        <div className="atendimentos-clinica-stack">
                          <Link
                            href={`/dashboard/colaboradores/${item.patientId}`}
                            className="atendimentos-clinica-link atendimentos-clinica-primary-text"
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
                        >
                          {item.companyName}
                        </Link>
                      </td>
                      <td>
                        <span className="atendimentos-clinica-primary-text">
                          {CLINICAL_EXAM_LABELS[item.clinicalExamType]}
                        </span>
                        <span className="atendimentos-clinica-meta block font-mono text-[11px] text-slate-400">
                          {item.protocol}
                        </span>
                      </td>
                      <td className="whitespace-nowrap tabular-nums text-sm text-slate-600">
                        {format(new Date(item.requestedDate), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td>
                        <StatusBadge
                          status={item.status}
                          type="referral"
                          label={getClinicReferralStatusLabel(item.status)}
                        />
                      </td>
                      {canManage && (
                        <td className="colaboradores-empresa-td-actions">
                          <ReferralStatusMenu
                            referralId={item.id}
                            currentStatus={item.status}
                            onCancelRequest={() => openCancelDialog(item)}
                            onSuccess={refreshAfterStatus}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="colaboradores-empresa-mobile-list md:hidden">
              {initialItems.map((item) => (
                <MobileListCard
                  key={item.id}
                  icon={FileText}
                  title={item.employeeName}
                  subtitle={`${item.companyName} · ${REFERRAL_SOURCE_SHORT_LABELS[item.source]}`}
                  meta={CLINICAL_EXAM_LABELS[item.clinicalExamType]}
                  badge={
                    <StatusBadge
                      status={item.status}
                      type="referral"
                      label={getClinicReferralStatusLabel(item.status)}
                    />
                  }
                >
                  {canManage && (
                    <div className="mt-2">
                      <ReferralStatusMenu
                        referralId={item.id}
                        currentStatus={item.status}
                        onCancelRequest={() => openCancelDialog(item)}
                        onSuccess={refreshAfterStatus}
                      />
                    </div>
                  )}
                </MobileListCard>
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

      {isEmpresa && (
        <ReferralEmpresaDetailDialog
          referral={detail}
          open={!!selectedId}
          loading={detailLoading}
          error={detailError}
          onOpenChange={(open) => !open && setSelectedId(null)}
          onRetry={() => selectedId && loadDetail(selectedId)}
        />
      )}

      {!isEmpresa && statusTarget && (
        <ReferralStatusDialog
          open={statusDialogOpen}
          onOpenChange={(open) => {
            setStatusDialogOpen(open);
            if (!open) setStatusTarget(null);
          }}
          referralId={statusTarget.id}
          currentStatus={statusTarget.status}
          onSuccess={refreshAfterStatus}
          clinicMode
          cancelOnly
        />
      )}
    </>
  );

  if (embedded) return body;

  return (
    <PageModule className={isEmpresa ? undefined : "atendimentos-clinica"}>{body}</PageModule>
  );
}
