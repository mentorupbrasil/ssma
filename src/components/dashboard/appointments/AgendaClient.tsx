"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
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
import { getAppointmentDetail, cancelAppointment, markAppointmentNoShow } from "@/actions/appointments";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
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
  filters,
}: AgendaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      startTransition(() => {
        router.push(`/dashboard/agenda?${params.toString()}`);
      });
    },
    [router, searchParams]
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
      router.push("/dashboard/agenda");
    });
  };

  const goToday = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setAnchorDate(today);
    updateFilters({ date: today, view: activeView, status: activeStatus });
  };

  const shiftDate = (days: number) => {
    const current = parseISO(anchorDate);
    current.setDate(current.getDate() + days);
    const next = format(current, "yyyy-MM-dd");
    setAnchorDate(next);
    updateFilters({ date: next, view: activeView, status: activeStatus });
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
    window.history.replaceState(null, "", `/dashboard/agenda?${params.toString()}`);
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/dashboard/agenda?${qs}` : "/dashboard/agenda");
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

  return (
    <div className="referrals-module">
      <PageHeader
        title="Agenda"
        description="Agendamentos de atendimentos e exames ocupacionais"
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

      <div className="referral-stat-grid referral-stat-grid-3 lg:grid-cols-6">
        {APPOINTMENT_STAT_CARDS.map((card) => {
          const count = statusCounts[card.key] ?? 0;
          const isActive = activeStatus === card.status;
          return (
            <button
              key={card.key}
              type="button"
              className={cn("referral-stat-card text-left", isActive && "referral-stat-card-active")}
              onClick={() =>
                updateFilters({
                  status: isActive ? "ALL" : card.status,
                  date: anchorDate,
                  view: activeView,
                })
              }
            >
              <span className="referral-stat-count">{count}</span>
              <span className="referral-stat-label">{card.label}</span>
            </button>
          );
        })}
      </div>

      <div className="referral-filters mt-6">
        <div className="referral-filters-grid">
          <div className="referral-filter-search">
            <Search className="referral-filter-search-icon h-4 w-4" />
            <Input
              placeholder="Buscar por colaborador, empresa, protocolo ou exame"
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
            <option value="EM_ATENDIMENTO">Em atendimento</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="FALTOU">Faltou</option>
            <option value="REAGENDADO">Reagendado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          {professionals.length > 0 && (
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
          <Button variant="ghost" size="sm" onClick={() => shiftDate(activeView === "day" ? -1 : -7)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-semibold text-[#0F3D4A]">
            {activeView === "day"
              ? format(parseISO(anchorDate), "EEEE, d 'de' MMMM yyyy", { locale: ptBR })
              : activeView === "week"
                ? `Semana de ${format(parseISO(anchorDate), "d MMM", { locale: ptBR })}`
                : format(parseISO(anchorDate), "MMMM yyyy", { locale: ptBR })}
          </p>
          <Button variant="ghost" size="sm" onClick={() => shiftDate(activeView === "day" ? 1 : 7)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="relative mt-4">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
          </div>
        )}

        {initialItems.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
            <p className="font-medium text-slate-600">
              Nenhum agendamento para o período selecionado
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Crie um novo agendamento ou ajuste os filtros.
            </p>
            {canManage && (
              <Button variant="brand" className="mt-4" onClick={() => setNewDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo agendamento
              </Button>
            )}
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
