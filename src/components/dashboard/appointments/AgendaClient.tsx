"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, addDays, addMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  Loader2,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";
import type { AppointmentListItem, AppointmentDetailSerialized, AppointmentViewMode } from "@/lib/appointments";
import {
  APPOINTMENT_STAT_CARDS,
  getClinicalExamLabel,
} from "@/lib/appointments";
import { appointmentStatCardsForEmpresa } from "@/lib/empresa-portal";
import { getAppointmentDetail, cancelAppointment, markAppointmentNoShow } from "@/actions/appointments";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageModule } from "@/components/dashboard/PageModule";
import { FilterMetricGrid } from "@/components/dashboard/FilterMetricGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
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
import { AppointmentDetailContent } from "./AppointmentDetailContent";
import {
  NewAppointmentDialog,
  RescheduleAppointmentDialog,
  AppointmentReasonDialog,
  AddAppointmentNoteDialog,
} from "./AppointmentDialogs";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };
type PatientOption = { id: string; name: string };
type ProfessionalOption = { id: string; name: string };

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
  isEmpresaPortal?: boolean;
  embedded?: boolean;
  listPath?: string;
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

const VIEW_MODES: { value: AppointmentViewMode; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "list", label: "Lista" },
];

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
  isEmpresaPortal = false,
  embedded = false,
  listPath: listPathProp,
  filters,
}: AgendaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const listPath = listPathProp ?? (embedded ? "/dashboard/encaminhamentos" : "/dashboard/agenda");

  const [q, setQ] = useState(filters.q ?? "");
  const [companyId, setCompanyId] = useState(filters.companyId ?? "");
  const [patientId, setPatientId] = useState(filters.patientId ?? "");
  const [clinicalExamType, setClinicalExamType] = useState(filters.clinicalExamType ?? "");
  const [professionalId, setProfessionalId] = useState(filters.professionalId ?? "");
  const [roomName, setRoomName] = useState(filters.roomName ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [anchorDate, setAnchorDate] = useState(filters.date ?? format(new Date(), "yyyy-MM-dd"));

  const activeStatus = filters.status ?? "ALL";
  const activeView = filters.view ?? "day";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AppointmentDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (embedded) params.set("tab", "agenda");
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      startTransition(() => {
        router.push(`${listPath}?${params.toString()}`);
      });
    },
    [router, searchParams, embedded, listPath]
  );

  const handleSearch = () => {
    updateFilters({
      q,
      companyId,
      patientId,
      clinicalExamType,
      professionalId,
      roomName,
      dateFrom,
      dateTo,
      date: anchorDate,
      status: activeStatus,
      view: activeView,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCompanyId("");
    setPatientId("");
    setClinicalExamType("");
    setProfessionalId("");
    setRoomName("");
    setDateFrom("");
    setDateTo("");
    setAnchorDate(format(new Date(), "yyyy-MM-dd"));
    startTransition(() => {
      router.push(embedded ? `${listPath}?tab=agenda` : listPath);
    });
  };

  const goToday = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setAnchorDate(today);
    updateFilters({ date: today, view: activeView, status: activeStatus });
  };

  const shiftDate = (direction: number) => {
    const current = parseISO(anchorDate);
    let next: Date;
    if (activeView === "month") {
      next = addMonths(current, direction);
    } else if (activeView === "week") {
      next = addDays(current, direction * 7);
    } else {
      next = addDays(current, direction);
    }
    const nextStr = format(next, "yyyy-MM-dd");
    setAnchorDate(nextStr);
    updateFilters({ date: nextStr, view: activeView, status: activeStatus });
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
    if (embedded) params.set("tab", "agenda");
    params.set("id", id);
    window.history.replaceState(null, "", `${listPath}?${params.toString()}`);
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    const params = new URLSearchParams(searchParams.toString());
    if (embedded) params.set("tab", "agenda");
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

  useEffect(() => {
    if (searchParams.get("new") === "1" && canManage) {
      setNewDialogOpen(true);
    }
  }, [searchParams, canManage]);

  const groupedByDate = initialItems.reduce<Record<string, AppointmentListItem[]>>((acc, item) => {
    const key = format(new Date(item.scheduledAt), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const showDateGroups = activeView === "week" || activeView === "month" || activeView === "list";
  const appointmentCards = isEmpresaPortal ? appointmentStatCardsForEmpresa() : APPOINTMENT_STAT_CARDS;

  const body = (
    <>
      {!embedded && (
        <PageHeader
          title="Agenda"
          description={
            isEmpresaPortal
              ? "Acompanhe os agendamentos da sua equipe"
              : "Agendamentos de atendimentos e exames ocupacionais"
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>
              Hoje
            </Button>
            {VIEW_MODES.map((v) => (
              <Button
                key={v.value}
                variant={activeView === v.value ? "brand" : "outline"}
                size="sm"
                onClick={() => updateFilters({ view: v.value, date: anchorDate, status: activeStatus })}
              >
                {v.label === "Dia" && <CalendarDays className="mr-1 h-3.5 w-3.5" />}
                {v.label === "Lista" && <List className="mr-1 h-3.5 w-3.5" />}
                {v.label}
              </Button>
            ))}
            {canManage && (
              <Button variant="brand" onClick={() => setNewDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo agendamento
              </Button>
            )}
          </div>
        </PageHeader>
      )}

      {embedded && (
        <div className="exames-agenda-toolbar mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            Horários confirmados pela clínica para sua equipe.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>
              Hoje
            </Button>
            {VIEW_MODES.map((v) => (
              <Button
                key={v.value}
                variant={activeView === v.value ? "brand" : "outline"}
                size="sm"
                onClick={() => updateFilters({ view: v.value, date: anchorDate, status: activeStatus })}
              >
                {v.label === "Dia" && <CalendarDays className="mr-1 h-3.5 w-3.5" />}
                {v.label === "Lista" && <List className="mr-1 h-3.5 w-3.5" />}
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <FilterMetricGrid
        items={appointmentCards.map((card) => {
          const isActive = activeStatus === card.status;
          return {
            key: card.key,
            metaKey: `appointment:${card.key}`,
            label: card.label,
            value: statusCounts[card.key] ?? 0,
            active: isActive,
            onClick: () =>
              updateFilters({
                status: isActive ? "ALL" : card.status,
                date: anchorDate,
                view: activeView,
              }),
          };
        })}
      />

      <div className={cn("referral-filters mt-6", isEmpresaPortal && "empresa-filter-panel")}>
        <div className="referral-filters-grid">
          <div className="referral-filter-search sm:col-span-2">
            <Search className="referral-filter-search-icon h-4 w-4" />
            <Input
              placeholder={
                isEmpresaPortal
                  ? "Buscar por colaborador, protocolo ou exame"
                  : "Buscar por colaborador, empresa, protocolo ou exame"
              }
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Input
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            title="Data"
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Período de"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="Período até"
          />
          {companies.length > 0 && (
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="form-select h-9"
            >
              <option value="">Empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {patients.length > 0 && (
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="form-select h-9"
            >
              <option value="">Colaborador</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={clinicalExamType}
            onChange={(e) => setClinicalExamType(e.target.value)}
            className="form-select h-9"
          >
            <option value="">Tipo de exame</option>
            <option value="ADMISSIONAL">Admissional</option>
            <option value="DEMISSIONAL">Demissional</option>
            <option value="PERIODICO">Periódico</option>
            <option value="RETORNO_TRABALHO">Retorno ao trabalho</option>
            <option value="MUDANCA_FUNCAO">Mudança de função</option>
          </select>
          <select
            value={activeStatus === "TODAY_AGENDADO" ? "" : activeStatus}
            onChange={(e) =>
              updateFilters({
                status: e.target.value || "ALL",
                date: anchorDate,
                view: activeView,
              })
            }
            className="form-select h-9"
          >
            <option value="">Status</option>
            <option value="AGENDADO">Agendado</option>
            <option value="CONFIRMADO">Confirmado</option>
            {!isEmpresaPortal && <option value="EM_ATENDIMENTO">Em atendimento</option>}
            <option value="CONCLUIDO">Concluído</option>
            <option value="FALTOU">Faltou</option>
            <option value="REAGENDADO">Reagendado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          {professionals.length > 0 && !isEmpresaPortal && (
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="form-select h-9"
            >
              <option value="">Profissional</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {rooms.length > 0 && (
            <select
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="form-select h-9"
            >
              <option value="">Unidade/sala</option>
              {rooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="referral-filters-actions mt-3 flex gap-2">
          <Button variant="brand" size="sm" onClick={handleSearch} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Filtrar"}
          </Button>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      </div>

      {(activeView === "day" || activeView === "week" || activeView === "month") && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => shiftDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-semibold text-[#0F3D4A]">
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

      <div className="relative mt-4">
        {isPending && <LoadingState overlay label="Atualizando agenda..." />}

        {initialItems.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum agendamento para o período selecionado"
            description={
              isEmpresaPortal
                ? "Quando a clínica confirmar horários, eles aparecerão aqui. Você também pode ajustar os filtros."
                : "Crie um novo agendamento ou ajuste os filtros."
            }
            action={
              canManage
                ? { label: "Novo agendamento", onClick: () => setNewDialogOpen(true) }
                : isEmpresaPortal
                  ? { label: "Solicitar exames", href: "/dashboard/encaminhamentos/novo" }
                  : undefined
            }
          />
        ) : activeView === "week" ? (
          <div className="space-y-6">
            <WeekCalendarGrid
              anchorDate={anchorDate}
              items={initialItems}
              onOpen={openDetail}
            />
            {Object.entries(groupedByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, items]) => (
                <div key={date}>
                  <h3 className="mb-3 font-semibold text-[#0F3D4A]">
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
                  <h3 className="mb-3 font-semibold text-[#0F3D4A]">
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
            Exibindo {initialItems.length} de {initialTotal} agendamentos
          </p>
        )}
      </div>

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalhe do agendamento</SheetTitle>
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
              onRefresh={refreshDetail}
              onReschedule={() => setRescheduleOpen(true)}
              onCancel={() => setCancelOpen(true)}
              onNoShow={() => setNoShowOpen(true)}
              onAddNote={() => setNoteOpen(true)}
            />
          )}
        </SheetContent>
      </Sheet>

      <NewAppointmentDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={(id) => {
          router.refresh();
          if (id) openDetail(id);
        }}
      />

      {selectedId && (
        <>
          <RescheduleAppointmentDialog
            open={rescheduleOpen}
            onOpenChange={setRescheduleOpen}
            appointmentId={selectedId}
            onSuccess={refreshDetail}
          />
          <AppointmentReasonDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            title="Cancelar agendamento"
            description="Esta ação será registrada no histórico. Informe o motivo."
            confirmLabel="Confirmar cancelamento"
            onConfirm={(notes) => cancelAppointment(selectedId, { notes })}
            onSuccess={refreshDetail}
          />
          <AppointmentReasonDialog
            open={noShowOpen}
            onOpenChange={setNoShowOpen}
            title="Marcar falta"
            description="Registre a falta do colaborador. É possível reagendar depois."
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
    </>
  );

  if (embedded) return body;

  return <PageModule>{body}</PageModule>;
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
    <div className="grid grid-cols-7 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayItems = items.filter((i) => isSameDay(parseISO(i.scheduledAt), day));
        const isToday = isSameDay(day, new Date());
        return (
          <div
            key={key}
            className={cn(
              "min-h-[100px] rounded-lg border p-2",
              isToday ? "border-[#16A085] bg-emerald-50/40" : "border-slate-100"
            )}
          >
            <p className={cn("mb-2 text-xs font-semibold", isToday ? "text-[#16A085]" : "text-slate-500")}>
              {format(day, "EEE d", { locale: ptBR })}
            </p>
            <div className="space-y-1">
              {dayItems.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpen(item.id)}
                  className="block w-full truncate rounded bg-slate-50 px-1.5 py-1 text-left text-[10px] hover:bg-slate-100"
                >
                  {format(parseISO(item.scheduledAt), "HH:mm")} {item.employeeName ?? item.companyName}
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          {a.examSummary && (
            <p className="appointment-card-line">
              <span className="text-slate-400">Exames:</span> {a.examSummary}
            </p>
          )}
          {(a.professionalName || a.roomName) && (
            <p className="appointment-card-meta">
              {[a.professionalName, a.roomName].filter(Boolean).join(" · ")}
            </p>
          )}
          {a.notes && (
            <p className="appointment-card-notes line-clamp-2">{a.notes}</p>
          )}
        </button>
      ))}
    </div>
  );
}
