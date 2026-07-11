"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  format,
  parseISO,
  addDays,
  addMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  Loader2,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Play,
  XCircle,
  CalendarCheck,
  UserCheck,
  Stethoscope,
  CircleCheck,
  UserX,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { AppointmentListItem, AppointmentDetailSerialized, AppointmentViewMode } from "@/lib/appointments";
import {
  APPOINTMENT_KPI_CARDS,
  getClinicalExamLabel,
  canClinicalAppointmentActions,
  canReceptionAppointmentActions,
} from "@/lib/appointments";
import {
  getAppointmentDetail,
  markAppointmentNoShow,
  confirmAppointment,
  startAppointmentAttendance,
  completeAppointment,
} from "@/actions/appointments";
import { PageModule } from "@/components/dashboard/PageModule";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterChips } from "@/components/dashboard/FilterChips";
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
import { AppointmentDetailContent } from "./AppointmentDetailContent";
import {
  AppointmentReasonDialog,
  AddAppointmentNoteDialog,
} from "./AppointmentDialogs";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };
type PatientOption = { id: string; name: string };
type ProfessionalOption = { id: string; name: string };

const STAT_ICONS: Record<string, LucideIcon> = {
  today: CalendarCheck,
  confirmado: UserCheck,
  em_atendimento: Stethoscope,
  concluido: CircleCheck,
  faltou: UserX,
};

const STAT_TONES: Record<string, "primary" | "warning"> = {
  today: "primary",
  confirmado: "primary",
  em_atendimento: "primary",
  concluido: "primary",
  faltou: "warning",
};

const VIEW_MODES: { value: AppointmentViewMode; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "list", label: "Lista" },
];

type AgendaClientProps = {
  initialItems: AppointmentListItem[];
  initialTotal: number;
  statusCounts: Record<string, number>;
  companies: CompanyOption[];
  patients: PatientOption[];
  professionals: ProfessionalOption[];
  rooms: string[];
  canManage: boolean;
  userRole: string;
  filters: {
    q?: string;
    status?: string;
    companyId?: string;
    patientId?: string;
    clinicalExamType?: string;
    professionalId?: string;
    roomName?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    view?: AppointmentViewMode;
  };
};

export function AgendaClient({
  initialItems,
  initialTotal,
  statusCounts,
  companies,
  patients,
  professionals,
  rooms,
  canManage,
  userRole,
  filters,
}: AgendaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const listPath = "/dashboard/agenda";

  const [q, setQ] = useState(filters.q ?? "");
  const [companyId, setCompanyId] = useState(filters.companyId ?? "");
  const [patientId, setPatientId] = useState(filters.patientId ?? "");
  const [clinicalExamType, setClinicalExamType] = useState(filters.clinicalExamType ?? "");
  const [statusFilter, setStatusFilter] = useState(
    filters.status && filters.status !== "TODAY_AGENDADO" ? filters.status : ""
  );
  const [professionalId, setProfessionalId] = useState(filters.professionalId ?? "");
  const [roomName, setRoomName] = useState(filters.roomName ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [anchorDate, setAnchorDate] = useState(filters.date ?? format(new Date(), "yyyy-MM-dd"));
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    Boolean(filters.patientId || filters.professionalId || filters.dateFrom || filters.dateTo)
  );

  const activeStatus = filters.status ?? "";
  const activeView = filters.view ?? "day";
  const canClinical = canClinicalAppointmentActions(userRole);
  const canReception = canReceptionAppointmentActions(userRole);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AppointmentDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [noShowOpen, setNoShowOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      startTransition(() => {
        router.push(`${listPath}?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const pushCurrentFilters = (extra?: Record<string, string | undefined>) => {
    const nextStatus =
      extra && "status" in extra
        ? extra.status
        : statusFilter ||
          (activeStatus === "TODAY_AGENDADO" ? "TODAY_AGENDADO" : activeStatus) ||
          undefined;

    updateFilters({
      q: q || undefined,
      companyId: companyId || undefined,
      patientId: patientId || undefined,
      clinicalExamType: clinicalExamType || undefined,
      professionalId: professionalId || undefined,
      roomName: roomName || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      date: anchorDate,
      status: nextStatus,
      view: activeView,
      ...extra,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCompanyId("");
    setPatientId("");
    setClinicalExamType("");
    setStatusFilter("");
    setProfessionalId("");
    setRoomName("");
    setDateFrom("");
    setDateTo("");
    setAnchorDate(format(new Date(), "yyyy-MM-dd"));
    setMoreFiltersOpen(false);
    startTransition(() => router.push(listPath));
  };

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.q ||
          filters.status ||
          filters.companyId ||
          filters.patientId ||
          filters.clinicalExamType ||
          filters.professionalId ||
          filters.roomName ||
          filters.dateFrom ||
          filters.dateTo
      ),
    [filters]
  );

  const advancedFilterCount = [
    filters.patientId,
    filters.professionalId,
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
            const kpi = APPOINTMENT_KPI_CARDS.find((c) => c.status === v);
            if (kpi) return kpi.label;
            if (v === "AGENDADO") return "Status: Agendado";
            if (v === "CONFIRMADO") return "Status: Confirmado";
            if (v === "EM_ATENDIMENTO") return "Status: Em atendimento";
            if (v === "CONCLUIDO") return "Status: Concluído";
            if (v === "FALTOU") return "Status: Faltou";
            if (v === "REAGENDADO") return "Status: Reagendado";
            if (v === "CANCELADO") return "Status: Cancelado";
            if (v === "TODAY_AGENDADO") return "Agendados hoje";
            return `Status: ${v}`;
          },
          skip: (v) => v === "ALL",
        },
        {
          key: "companyId",
          value: filters.companyId,
          label: (v) => `Empresa: ${companies.find((c) => c.id === v)?.name ?? v}`,
        },
        {
          key: "patientId",
          value: filters.patientId,
          label: (v) => `Colaborador: ${patients.find((p) => p.id === v)?.name ?? v}`,
        },
        {
          key: "clinicalExamType",
          value: filters.clinicalExamType,
          label: (v) =>
            `Exame: ${CLINICAL_EXAM_LABELS[v as keyof typeof CLINICAL_EXAM_LABELS] ?? v}`,
        },
        {
          key: "professionalId",
          value: filters.professionalId,
          label: (v) =>
            `Responsável: ${professionals.find((p) => p.id === v)?.name ?? v}`,
        },
        { key: "roomName", value: filters.roomName, label: (v) => `Unidade/sala: ${v}` },
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
      ]),
    [filters, companies, patients, professionals]
  );

  const removeChip = (key: string) => {
    if (key === "q") setQ("");
    if (key === "companyId") setCompanyId("");
    if (key === "patientId") setPatientId("");
    if (key === "clinicalExamType") setClinicalExamType("");
    if (key === "status") setStatusFilter("");
    if (key === "professionalId") setProfessionalId("");
    if (key === "roomName") setRoomName("");
    if (key === "dateFrom") {
      setDateFrom("");
      setDateTo("");
      updateFilters({ ...removeFilterKey(key, filters), dateTo: undefined });
      return;
    }
    updateFilters(removeFilterKey(key, filters));
  };

  useEffect(() => {
    setQ(filters.q ?? "");
    setCompanyId(filters.companyId ?? "");
    setPatientId(filters.patientId ?? "");
    setClinicalExamType(filters.clinicalExamType ?? "");
    setStatusFilter(
      filters.status && filters.status !== "TODAY_AGENDADO" ? filters.status : ""
    );
    setProfessionalId(filters.professionalId ?? "");
    setRoomName(filters.roomName ?? "");
    setDateFrom(filters.dateFrom ?? "");
    setDateTo(filters.dateTo ?? "");
    setAnchorDate(filters.date ?? format(new Date(), "yyyy-MM-dd"));
  }, [filters]);

  const goToday = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setAnchorDate(today);
    updateFilters({
      date: today,
      view: "day",
      dateFrom: undefined,
      dateTo: undefined,
      status: activeStatus || undefined,
    });
  };

  const shiftDate = (direction: number) => {
    const current = parseISO(anchorDate);
    let next: Date;
    if (activeView === "month") next = addMonths(current, direction);
    else if (activeView === "week") next = addDays(current, direction * 7);
    else next = addDays(current, direction);
    const nextStr = format(next, "yyyy-MM-dd");
    setAnchorDate(nextStr);
    updateFilters({ date: nextStr, view: activeView, status: activeStatus || undefined });
  };

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    const result = await getAppointmentDetail(id);
    setDetailLoading(false);
    if (result.success) {
      setDetail(result.appointment);
    } else {
      setDetailError(result.error);
      setDetail(null);
    }
  }, []);

  const openDetail = (id: string) => {
    setSelectedId(id);
    loadDetail(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    window.history.replaceState(null, "", `${listPath}?${params.toString()}`);
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${listPath}?${qs}` : listPath);
  };

  const refreshDetail = () => {
    if (selectedId) loadDetail(selectedId);
    router.refresh();
  };

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl && idFromUrl !== selectedId) {
      openDetail(idFromUrl);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const runRowAction = async (
    key: string,
    id: string,
    fn: () => Promise<{ success: boolean; error?: string }>
  ) => {
    setActionLoading(`${key}:${id}`);
    const result = await fn();
    setActionLoading(null);
    if (result.success) {
      toast.success("Atualizado!");
      router.refresh();
      if (selectedId === id) loadDetail(id);
    } else {
      toast.error(result.error ?? "Erro");
    }
  };

  const isTerminal = (status: string) =>
    ["CONCLUIDO", "CANCELADO", "REAGENDADO", "FALTOU"].includes(status);

  const groupedByDate = initialItems.reduce<Record<string, AppointmentListItem[]>>((acc, item) => {
    const key = format(new Date(item.scheduledAt), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const showDateGroups = activeView === "week" || activeView === "month";
  const isTodayActive =
    anchorDate === format(new Date(), "yyyy-MM-dd") &&
    activeView === "day" &&
    !filters.dateFrom &&
    !filters.dateTo;

  const resultLabel =
    initialTotal === 1
      ? "1 atendimento agendado"
      : `${initialTotal} atendimentos agendados`;

  return (
    <PageModule className="atendimentos-agendados-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Atendimentos agendados</h1>
          <p className="colaboradores-empresa-subtitle">
            Acompanhe os colaboradores com data e horário confirmados.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions atendimentos-agendados-views">
          <Button
            variant={isTodayActive ? "brand" : "outline"}
            size="sm"
            className="rounded-lg"
            onClick={goToday}
          >
            Hoje
          </Button>
          {VIEW_MODES.map((v) => (
            <Button
              key={v.value}
              variant={activeView === v.value && !(v.value === "day" && isTodayActive) ? "brand" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() =>
                updateFilters({
                  view: v.value,
                  date: anchorDate,
                  status: activeStatus || undefined,
                })
              }
            >
              {v.label === "Dia" && <CalendarDays className="mr-1 h-3.5 w-3.5" />}
              {v.label === "Lista" && <List className="mr-1 h-3.5 w-3.5" />}
              {v.label}
            </Button>
          ))}
        </div>
      </header>

      <div className="colaboradores-empresa-stats atendimentos-agendados-stats">
        {APPOINTMENT_KPI_CARDS.map((card) => {
          const Icon = STAT_ICONS[card.key] ?? CalendarDays;
          const isActive = activeStatus === card.status;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() =>
                updateFilters({
                  status: isActive ? undefined : card.status,
                  date: anchorDate,
                  view: activeView,
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
              placeholder="Buscar por colaborador, empresa, CPF ou exame"
              aria-label="Buscar atendimentos agendados"
              className="colaboradores-empresa-search-input"
            />
          </div>

          <Input
            type="date"
            value={anchorDate}
            onChange={(e) => {
              const value = e.target.value;
              setAnchorDate(value);
              pushCurrentFilters({ date: value || undefined });
            }}
            aria-label="Data"
            className="h-9 rounded-lg text-sm"
          />

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
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value);
              pushCurrentFilters({ status: value || undefined });
            }}
            aria-label="Status"
            className="colaboradores-empresa-select"
          >
            <option value="">Status</option>
            <option value="AGENDADO">Agendado</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="EM_ATENDIMENTO">Em atendimento</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="FALTOU">Faltou</option>
            <option value="REAGENDADO">Reagendado</option>
            <option value="CANCELADO">Cancelado</option>
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

          <select
            value={roomName}
            onChange={(e) => {
              const value = e.target.value;
              setRoomName(value);
              pushCurrentFilters({ roomName: value || undefined });
            }}
            aria-label="Unidade ou sala"
            className="colaboradores-empresa-select"
          >
            <option value="">Unidade/sala</option>
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r}
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
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Responsável"
            >
              <option value="">Responsável</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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

      {(activeView === "day" || activeView === "week" || activeView === "month") && (
        <div className="atendimentos-agendados-nav">
          <Button variant="ghost" size="sm" onClick={() => shiftDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="atendimentos-agendados-nav-label">
            {activeView === "day"
              ? format(parseISO(anchorDate), "EEEE, d 'de' MMMM yyyy", { locale: ptBR })
              : activeView === "week"
                ? `Semana de ${format(parseISO(anchorDate), "d MMM", { locale: ptBR })}`
                : format(parseISO(anchorDate), "MMMM yyyy", { locale: ptBR })}
          </p>
          <Button variant="ghost" size="sm" onClick={() => shiftDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="colaboradores-empresa-table-wrap relative">
        {isPending && <LoadingState overlay label="Atualizando atendimentos agendados..." />}

        <div className="colaboradores-empresa-result-bar">
          <span className="text-xs text-slate-500">{resultLabel}</span>
        </div>

        {initialItems.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum atendimento agendado para este período"
            description="Os agendamentos recebidos aparecerão aqui quando houver data e horário confirmados."
          />
        ) : activeView === "list" ? (
          <>
            <div className="colaboradores-empresa-table-scroll">
              <table className="colaboradores-empresa-table atendimentos-agendados-table">
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Colaborador</th>
                    <th>Empresa</th>
                    <th>Tipo de exame</th>
                    <th>Unidade ou sala</th>
                    <th>Status</th>
                    <th>Responsável</th>
                    <th className="colaboradores-empresa-th-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {initialItems.map((item) => (
                    <tr
                      key={item.id}
                      className="atendimentos-agendados-row cursor-pointer"
                      onClick={() => openDetail(item.id)}
                    >
                      <td className="atendimentos-agendados-time whitespace-nowrap">
                        {format(new Date(item.scheduledAt), "HH:mm")}
                        <span className="atendimentos-agendados-date-meta">
                          {format(new Date(item.scheduledAt), "dd/MM", { locale: ptBR })}
                        </span>
                      </td>
                      <td className="atendimentos-agendados-primary">
                        {item.employeeName ?? "—"}
                      </td>
                      <td>{item.companyName ?? "—"}</td>
                      <td className="whitespace-nowrap">
                        {getClinicalExamLabel(item.clinicalExamType, item.type)}
                      </td>
                      <td className="whitespace-nowrap">{item.roomName ?? "—"}</td>
                      <td>
                        <StatusBadge status={item.status} type="appointment" />
                      </td>
                      <td className="whitespace-nowrap">
                        {item.professionalName ?? "—"}
                      </td>
                      <td
                        className="colaboradores-empresa-td-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowActions
                          item={item}
                          canManage={canManage}
                          canClinical={canClinical}
                          canReception={canReception}
                          actionLoading={actionLoading}
                          onView={() => openDetail(item.id)}
                          onConfirm={() =>
                            runRowAction("confirm", item.id, () => confirmAppointment(item.id))
                          }
                          onStart={() =>
                            runRowAction("start", item.id, () =>
                              startAppointmentAttendance(item.id)
                            )
                          }
                          onComplete={() =>
                            runRowAction("complete", item.id, () => completeAppointment(item.id))
                          }
                          onNoShow={() => {
                            openDetail(item.id);
                            setNoShowOpen(true);
                          }}
                          isTerminal={isTerminal(item.status)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="colaboradores-empresa-mobile-list">
              {initialItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="atendimentos-agendados-mobile-card"
                  onClick={() => openDetail(item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="atendimentos-agendados-time">
                      {format(new Date(item.scheduledAt), "HH:mm")}
                    </span>
                    <StatusBadge status={item.status} type="appointment" />
                  </div>
                  <p className="atendimentos-agendados-primary">{item.employeeName ?? "—"}</p>
                  <p className="text-xs text-slate-500">
                    {item.companyName ?? "—"} ·{" "}
                    {getClinicalExamLabel(item.clinicalExamType, item.type)}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : activeView === "week" ? (
          <div className="space-y-6">
            <WeekCalendarGrid anchorDate={anchorDate} items={initialItems} onOpen={openDetail} />
            {Object.entries(groupedByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, items]) => (
                <div key={date}>
                  <h3 className="atendimentos-agendados-group-title">
                    {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <AppointmentCardGrid items={items} onOpen={openDetail} />
                </div>
              ))}
          </div>
        ) : showDateGroups ? (
          <div className="space-y-6">
            {Object.entries(groupedByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, items]) => (
                <div key={date}>
                  <h3 className="atendimentos-agendados-group-title">
                    {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <AppointmentCardGrid items={items} onOpen={openDetail} />
                </div>
              ))}
          </div>
        ) : (
          <AppointmentCardGrid items={initialItems} onOpen={openDetail} />
        )}

        {initialTotal > initialItems.length && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Exibindo {initialItems.length} de {initialTotal} atendimentos agendados
          </p>
        )}
      </div>

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalhe do atendimento</SheetTitle>
            <SheetDescription>
              {detail?.protocol ?? detail?.title ?? "Carregando..."}
            </SheetDescription>
          </SheetHeader>
          {detailLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
            </div>
          )}
          {detailError && (
            <p className="py-8 text-center text-sm text-red-600">{detailError}</p>
          )}
          {detail && !detailLoading && (
            <AppointmentDetailContent
              appointment={detail}
              userRole={userRole}
              canManage={canManage}
              operationalOnly
              onRefresh={refreshDetail}
              onReschedule={() => undefined}
              onCancel={() => undefined}
              onNoShow={() => setNoShowOpen(true)}
              onAddNote={() => setNoteOpen(true)}
            />
          )}
        </SheetContent>
      </Sheet>

      {selectedId && (
        <>
          <AppointmentReasonDialog
            open={noShowOpen}
            onOpenChange={setNoShowOpen}
            title="Registrar falta"
            description="Registre a falta do colaborador neste horário."
            confirmLabel="Confirmar falta"
            onConfirm={(notes) => markAppointmentNoShow(selectedId, { notes })}
            onSuccess={refreshDetail}
          />
          <AddAppointmentNoteDialog
            open={noteOpen}
            onOpenChange={setNoteOpen}
            appointmentId={selectedId}
            onSuccess={refreshDetail}
          />
        </>
      )}
    </PageModule>
  );
}

function RowActions({
  item,
  canManage,
  canClinical,
  canReception,
  actionLoading,
  onView,
  onConfirm,
  onStart,
  onComplete,
  onNoShow,
  isTerminal,
}: {
  item: AppointmentListItem;
  canManage: boolean;
  canClinical: boolean;
  canReception: boolean;
  actionLoading: string | null;
  onView: () => void;
  onConfirm: () => void;
  onStart: () => void;
  onComplete: () => void;
  onNoShow: () => void;
  isTerminal: boolean;
}) {
  const busy = actionLoading?.endsWith(`:${item.id}`);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Ações" disabled={!!busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          Ver atendimento
        </DropdownMenuItem>
        {canManage && !isTerminal && (
          <>
            {item.status === "AGENDADO" && canReception && (
              <DropdownMenuItem onClick={onConfirm}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar presença
              </DropdownMenuItem>
            )}
            {["AGENDADO", "CONFIRMADO"].includes(item.status) && canClinical && (
              <DropdownMenuItem onClick={onStart}>
                <Play className="mr-2 h-4 w-4" />
                Iniciar atendimento
              </DropdownMenuItem>
            )}
            {item.status === "EM_ATENDIMENTO" && canClinical && (
              <DropdownMenuItem onClick={onComplete}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Concluir atendimento
              </DropdownMenuItem>
            )}
            {canReception && (
              <DropdownMenuItem onClick={onNoShow}>
                <XCircle className="mr-2 h-4 w-4" />
                Registrar falta
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WeekCalendarGrid({
  anchorDate,
  items,
  onOpen,
}: {
  anchorDate: string;
  items: AppointmentListItem[];
  onOpen: (id: string) => void;
}) {
  const start = startOfWeek(parseISO(anchorDate), { weekStartsOn: 1 });
  const end = endOfWeek(parseISO(anchorDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="atendimentos-agendados-week-grid">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayItems = items.filter((i) => isSameDay(parseISO(i.scheduledAt), day));
        const isToday = isSameDay(day, new Date());
        return (
          <div
            key={key}
            className={cn(
              "atendimentos-agendados-week-day",
              isToday && "atendimentos-agendados-week-day--today"
            )}
          >
            <p
              className={cn(
                "atendimentos-agendados-week-day-label",
                isToday && "atendimentos-agendados-week-day-label--today"
              )}
            >
              {format(day, "EEE d", { locale: ptBR })}
            </p>
            <div className="space-y-1">
              {dayItems.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpen(item.id)}
                  className="atendimentos-agendados-week-item"
                >
                  {format(parseISO(item.scheduledAt), "HH:mm")}{" "}
                  {item.employeeName ?? item.companyName}
                </button>
              ))}
              {dayItems.length > 4 && (
                <p className="text-[10px] text-slate-400">+{dayItems.length - 4} mais</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AppointmentCardGrid({
  items,
  onOpen,
}: {
  items: AppointmentListItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="atendimentos-agendados-cards">
      {items.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onOpen(a.id)}
          className="appointment-card group text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="appointment-card-time">
              {format(new Date(a.scheduledAt), "HH:mm")}
            </span>
            <StatusBadge status={a.status} type="appointment" />
          </div>
          <p className="appointment-card-title">
            {a.protocol ? `Atendimento ${a.protocol}` : a.title}
          </p>
          {a.employeeName && (
            <p className="appointment-card-line">
              <span className="text-slate-400">Colaborador:</span> {a.employeeName}
            </p>
          )}
          {a.companyName && (
            <p className="appointment-card-line">
              <span className="text-slate-400">Empresa:</span> {a.companyName}
            </p>
          )}
          <p className="appointment-card-line">
            <span className="text-slate-400">Tipo:</span>{" "}
            {getClinicalExamLabel(a.clinicalExamType, a.type)}
          </p>
          {(a.professionalName || a.roomName) && (
            <p className="appointment-card-meta">
              {[a.professionalName, a.roomName].filter(Boolean).join(" · ")}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
