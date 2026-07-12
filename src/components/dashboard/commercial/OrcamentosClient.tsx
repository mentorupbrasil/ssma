"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Phone,
  CalendarClock,
  FileText,
  Trophy,
  XCircle,
  Send,
  Copy,
  CheckCircle2,
  RotateCcw,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getLeadDetail,
  getQuoteDetail,
  updateOpportunityStage,
  updateQuoteStatusCommercial,
  duplicateQuote,
  addCommercialNote,
} from "@/actions/commercial";
import type {
  CommercialTab,
  LeadListItem,
  QuoteListItem,
  FollowUpListItem,
  LeadDetailSerialized,
  QuoteDetailSerialized,
} from "@/lib/commercial";
import {
  COMMERCIAL_KPI_STRIP,
  COMMERCIAL_STAGE_LABELS,
  COMMERCIAL_STAGES,
  COMMERCIAL_PAGE_SIZE_OPTIONS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_FILTER_OPTIONS,
  FOLLOW_UP_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  formatCurrency,
  sourceLabel,
} from "@/lib/commercial";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SystemActionMenu, type SystemActionItem } from "@/components/dashboard/SystemActionMenu";
import { SystemModalShell } from "@/components/dashboard/SystemModalShell";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadDetailContent, QuoteDetailContent } from "./CommercialDetailContent";
import { QuoteFormDialog, RejectQuoteDialog } from "./CommercialDialogs";
import {
  OpportunityFormDialog,
  RegisterContactDialog,
  ScheduleFollowUpDialog,
  CompleteFollowUpDialog,
  RescheduleFollowUpDialog,
  MarkLostDialog,
  ConvertCompanyDialog,
} from "./OpportunityDialogs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CompanyOption = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  city: string | null;
  state: string | null;
  responsibleName: string | null;
  whatsapp: string | null;
  email: string | null;
};

type OpportunityOption = {
  id: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  cnpj: string | null;
  companyId: string | null;
  serviceInterest: string | null;
};

type OrcamentosClientProps = {
  initialItems: (LeadListItem | QuoteListItem | FollowUpListItem)[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  followUpBuckets: { atrasados: number; hoje: number; proximos: number };
  canManage: boolean;
  companies: CompanyOption[];
  opportunities: OpportunityOption[];
  assignees: { id: string; name: string }[];
  activeTab: CommercialTab;
  filters: Record<string, string | undefined>;
};

const TABS: { id: CommercialTab; label: string }[] = [
  { id: "oportunidades", label: "Oportunidades" },
  { id: "propostas", label: "Propostas" },
  { id: "followups", label: "Follow-ups" },
];

function isLead(item: unknown): item is LeadListItem {
  return !!item && typeof item === "object" && "stage" in item && "companyName" in item && !("quoteNumber" in item) && !("dueAt" in item);
}

function isQuote(item: unknown): item is QuoteListItem {
  return !!item && typeof item === "object" && "quoteNumber" in item;
}

function isFollowUp(item: unknown): item is FollowUpListItem {
  return !!item && typeof item === "object" && "dueAt" in item && "leadId" in item;
}

export function OrcamentosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  followUpBuckets,
  canManage,
  companies,
  opportunities,
  assignees,
  activeTab,
  filters,
}: OrcamentosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [detailLead, setDetailLead] = useState<LeadDetailSerialized | null>(null);
  const [detailQuote, setDetailQuote] = useState<QuoteDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [oppFormOpen, setOppFormOpen] = useState(false);
  const [editOpp, setEditOpp] = useState<LeadDetailSerialized | null>(null);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [editQuote, setEditQuote] = useState<QuoteDetailSerialized | null>(null);
  const [quoteSourceLeadId, setQuoteSourceLeadId] = useState<string | undefined>();
  const [quotePrefill, setQuotePrefill] = useState<
    Partial<{ companyName: string; responsibleName: string; phone: string; email: string; companyId: string }>
  >();

  const [contactLeadId, setContactLeadId] = useState<string | null>(null);
  const [scheduleLeadId, setScheduleLeadId] = useState<string | null>(null);
  const [lostLeadId, setLostLeadId] = useState<string | null>(null);
  const [convertOpp, setConvertOpp] = useState<LeadDetailSerialized | null>(null);
  const [completeFollowUpId, setCompleteFollowUpId] = useState<string | null>(null);
  const [rescheduleFollowUpId, setRescheduleFollowUpId] = useState<string | null>(null);
  const [rejectQuoteId, setRejectQuoteId] = useState<string | null>(null);
  const [noteFollowUpId, setNoteFollowUpId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));
  const rangeFrom = initialTotal === 0 ? 0 : (initialPage - 1) * pageSize + 1;
  const rangeTo = Math.min(initialPage * pageSize, initialTotal);

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>, opts?: { resetPage?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      });
      if (opts?.resetPage !== false && !("page" in updates)) params.delete("page");
      startTransition(() => router.push(`/dashboard/orcamentos?${params.toString()}`));
    },
    [router, searchParams]
  );

  useEffect(() => setQ(filters.q ?? ""), [filters.q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = q.trim();
      if (next === (filters.q ?? "")) return;
      updateFilters({ q: next || undefined });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [q, filters.q, updateFilters]);

  const openLead = async (id: string) => {
    setDetailLoading(true);
    setDetailQuote(null);
    const result = await getLeadDetail(id);
    setDetailLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDetailLead(result.lead);
  };

  const openQuote = async (id: string) => {
    setDetailLoading(true);
    setDetailLead(null);
    const result = await getQuoteDetail(id);
    setDetailLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDetailQuote(result.quote);
  };

  const refresh = () => router.refresh();

  const markWon = async (leadId: string) => {
    const result = await updateOpportunityStage(leadId, "GANHO");
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Oportunidade marcada como ganho.");
    if (result.suggestConvert) {
      const detail = await getLeadDetail(leadId);
      if (detail.success) setConvertOpp(detail.lead);
    }
    refresh();
  };

  const createProposalFromLead = async (leadId: string) => {
    const result = await getLeadDetail(leadId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const lead = result.lead;
    setQuoteSourceLeadId(lead.id);
    setQuotePrefill({
      companyName: lead.companyName ?? "",
      responsibleName: lead.name,
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      companyId: lead.companyId ?? "",
    });
    setEditQuote(null);
    setQuoteFormOpen(true);
  };

  const opportunityActions = (item: LeadListItem): SystemActionItem[] => {
    if (!canManage) return [];
    return [
      {
        label: "Ver oportunidade",
        hint: "Abrir detalhes",
        icon: Eye,
        iconTone: "docs",
        onClick: () => void openLead(item.id),
      },
      {
        label: "Editar",
        hint: "Alterar dados",
        icon: Pencil,
        iconTone: "docs",
        onClick: async () => {
          const result = await getLeadDetail(item.id);
          if (!result.success) return toast.error(result.error);
          setEditOpp(result.lead);
          setOppFormOpen(true);
        },
      },
      {
        label: "Registrar contato",
        hint: "Anotar interação",
        icon: Phone,
        iconTone: "docs",
        onClick: () => setContactLeadId(item.id),
      },
      {
        label: "Agendar follow-up",
        hint: "Próximo retorno",
        icon: CalendarClock,
        iconTone: "docs",
        onClick: () => setScheduleLeadId(item.id),
      },
      {
        label: "Criar proposta",
        hint: "Vincular orçamento",
        icon: FileText,
        iconTone: "docs",
        onClick: () => void createProposalFromLead(item.id),
      },
      {
        label: "Marcar como ganho",
        hint: "Fechar negócio",
        icon: Trophy,
        iconTone: "done",
        onClick: () => void markWon(item.id),
        disabled: item.stage === "GANHO",
      },
      {
        label: "Marcar como perdido",
        hint: "Encerrar com motivo",
        icon: XCircle,
        iconTone: "cancel",
        onClick: () => setLostLeadId(item.id),
        disabled: item.stage === "PERDIDO",
      },
    ];
  };

  const proposalActions = (item: QuoteListItem): SystemActionItem[] => {
    if (!canManage) return [];
    return [
      {
        label: "Visualizar",
        hint: "Detalhes da proposta",
        icon: Eye,
        iconTone: "docs",
        onClick: () => void openQuote(item.id),
      },
      {
        label: "Editar",
        hint: "Alterar proposta",
        icon: Pencil,
        iconTone: "docs",
        onClick: async () => {
          const result = await getQuoteDetail(item.id);
          if (!result.success) return toast.error(result.error);
          setEditQuote(result.quote);
          setQuoteSourceLeadId(result.quote.sourceLeadId ?? undefined);
          setQuoteFormOpen(true);
        },
      },
      {
        label: "Gerar / baixar PDF",
        hint: "Abrir versão para impressão",
        icon: FileText,
        iconTone: "docs",
        onClick: () =>
          window.open(`/dashboard/orcamentos/orcamento/${item.id}/imprimir`, "_blank"),
      },
      {
        label: "Enviar",
        hint: "Marcar como enviada",
        icon: Send,
        iconTone: "docs",
        onClick: async () => {
          const result = await updateQuoteStatusCommercial(item.id, "AGUARDANDO_RESPOSTA");
          if (!result.success) return toast.error(result.error);
          toast.success("Proposta marcada como enviada.");
          refresh();
        },
      },
      {
        label: "Duplicar",
        hint: "Criar cópia em rascunho",
        icon: Copy,
        iconTone: "docs",
        onClick: async () => {
          const result = await duplicateQuote(item.id);
          if (!result.success) return toast.error(result.error);
          toast.success("Proposta duplicada.");
          refresh();
        },
      },
      {
        label: "Marcar como aprovada",
        hint: "Cliente aceitou",
        icon: CheckCircle2,
        iconTone: "done",
        onClick: async () => {
          const result = await updateQuoteStatusCommercial(item.id, "APROVADO");
          if (!result.success) return toast.error(result.error);
          toast.success("Proposta aprovada.");
          if (item.sourceLeadId) {
            const detail = await getLeadDetail(item.sourceLeadId);
            if (detail.success && !detail.lead.companyId) setConvertOpp(detail.lead);
          }
          refresh();
        },
      },
      {
        label: "Marcar como recusada",
        hint: "Registrar recusa",
        icon: XCircle,
        iconTone: "cancel",
        onClick: () => setRejectQuoteId(item.id),
      },
    ];
  };

  const followUpActions = (item: FollowUpListItem): SystemActionItem[] => {
    if (!canManage) return [];
    return [
      {
        label: "Marcar como realizado",
        hint: "Registrar resultado",
        icon: CheckCircle2,
        iconTone: "done",
        onClick: () => setCompleteFollowUpId(item.id),
        disabled: item.status !== "PENDENTE",
      },
      {
        label: "Reagendar",
        hint: "Nova data",
        icon: RotateCcw,
        iconTone: "docs",
        onClick: () => setRescheduleFollowUpId(item.id),
      },
      {
        label: "Registrar observação",
        hint: "Anotar na oportunidade",
        icon: Pencil,
        iconTone: "docs",
        onClick: () => {
          setNoteFollowUpId(item.leadId);
          setNoteText("");
        },
      },
      {
        label: "Abrir oportunidade",
        hint: "Ver detalhes",
        icon: Eye,
        iconTone: "docs",
        onClick: () => void openLead(item.leadId),
      },
    ];
  };

  const clearFilters = () => {
    startTransition(() => router.push(`/dashboard/orcamentos?tab=${activeTab}`));
  };

  const hasFilters = Boolean(
    filters.q ||
      filters.stage ||
      filters.status ||
      filters.origem ||
      filters.assignedTo ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.card ||
      filters.bucket
  );

  return (
    <PageModule className="comercial-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Comercial</h1>
          <p className="colaboradores-empresa-subtitle">
            Gerencie oportunidades, propostas e negociações com empresas.
          </p>
        </div>
        {canManage && (
          <div className="colaboradores-empresa-header-actions">
            <Button
              type="button"
              variant="brand"
              size="sm"
              className="h-9 rounded-lg"
              onClick={() => {
                setEditOpp(null);
                setOppFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nova oportunidade
            </Button>
          </div>
        )}
      </header>

      <div className="comercial-kpi-strip" role="group" aria-label="Resumo comercial">
        {COMMERCIAL_KPI_STRIP.map((kpi) => {
          const active = filters.card === kpi.filter;
          const count = statCounts[kpi.key] ?? 0;
          return (
            <button
              key={kpi.key}
              type="button"
              className={cn("comercial-kpi-chip", active && "comercial-kpi-chip--active")}
              onClick={() =>
                updateFilters({
                  tab: kpi.tab,
                  card: active ? undefined : kpi.filter,
                  bucket: kpi.filter === "FOLLOWUPS_ATRASADOS" ? "atrasados" : undefined,
                  stage: undefined,
                  status: undefined,
                })
              }
            >
              <span className="comercial-kpi-chip-count">{count}</span>
              <span className="comercial-kpi-chip-label">{kpi.label}</span>
            </button>
          );
        })}
      </div>

      <nav className="comercial-clinica-tabs" aria-label="Abas comerciais">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(
              "comercial-clinica-tab",
              activeTab === t.id && "comercial-clinica-tab--active"
            )}
            onClick={() =>
              updateFilters({
                tab: t.id,
                card: undefined,
                stage: undefined,
                status: undefined,
                bucket: undefined,
                q: undefined,
              })
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === "oportunidades" && (
        <div className="comercial-filters-row">
          <div className="comercial-search">
            <Search className="comercial-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por empresa ou contato"
              className="comercial-search-input"
              aria-label="Buscar por empresa ou contato"
            />
          </div>
          <select
            className="comercial-select"
            value={filters.stage ?? ""}
            onChange={(e) => updateFilters({ stage: e.target.value || undefined, card: undefined })}
            aria-label="Etapa comercial"
          >
            <option value="">Todas as etapas</option>
            {COMMERCIAL_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {COMMERCIAL_STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
          <select
            className="comercial-select"
            value={filters.assignedTo ?? ""}
            onChange={(e) => updateFilters({ assignedTo: e.target.value || undefined })}
            aria-label="Responsável"
          >
            <option value="">Todos os responsáveis</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            className="comercial-select"
            value={filters.origem ?? ""}
            onChange={(e) => updateFilters({ origem: e.target.value || undefined })}
            aria-label="Origem"
          >
            <option value="">Todas as origens</option>
            {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="comercial-select"
            value={filters.dateFrom ?? ""}
            onChange={(e) => updateFilters({ dateFrom: e.target.value || undefined })}
            aria-label="Período de"
          />
          <input
            type="date"
            className="comercial-select"
            value={filters.dateTo ?? ""}
            onChange={(e) => updateFilters({ dateTo: e.target.value || undefined })}
            aria-label="Período até"
          />
          {hasFilters && (
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {activeTab === "propostas" && (
        <div className="comercial-filters-row">
          <div className="comercial-search">
            <Search className="comercial-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar proposta ou empresa"
              className="comercial-search-input"
            />
          </div>
          <select
            className="comercial-select"
            value={filters.status ?? ""}
            onChange={(e) => updateFilters({ status: e.target.value || undefined, card: undefined })}
          >
            <option value="">Todos os status</option>
            {QUOTE_STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            className="comercial-select"
            value={filters.assignedTo ?? ""}
            onChange={(e) => updateFilters({ assignedTo: e.target.value || undefined })}
          >
            <option value="">Todos os responsáveis</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {canManage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditQuote(null);
                setQuoteSourceLeadId(undefined);
                setQuotePrefill(undefined);
                setQuoteFormOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Criar proposta
            </Button>
          )}
          {hasFilters && (
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {activeTab === "followups" && (
        <div className="comercial-filters-row">
          <div className="comercial-followup-buckets">
            {(
              [
                ["atrasados", "Atrasados", followUpBuckets.atrasados],
                ["hoje", "Hoje", followUpBuckets.hoje],
                ["proximos", "Próximos", followUpBuckets.proximos],
              ] as const
            ).map(([bucket, label, count]) => (
              <button
                key={bucket}
                type="button"
                className={cn(
                  "comercial-bucket-chip",
                  (filters.bucket ?? "atrasados") === bucket && "comercial-bucket-chip--active"
                )}
                onClick={() =>
                  updateFilters({
                    bucket,
                    card: bucket === "atrasados" ? "FOLLOWUPS_ATRASADOS" : undefined,
                  })
                }
              >
                {label} ({count})
              </button>
            ))}
          </div>
          <div className="comercial-search">
            <Search className="comercial-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar follow-up"
              className="comercial-search-input"
            />
          </div>
          <select
            className="comercial-select"
            value={filters.assignedTo ?? ""}
            onChange={(e) => updateFilters({ assignedTo: e.target.value || undefined })}
          >
            <option value="">Todos os responsáveis</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="colaboradores-empresa-panel relative">
        {isPending && <LoadingState overlay label="Atualizando comercial..." />}

        {initialItems.length === 0 ? (
          <EmptyState
            compact
            className="border-0 bg-transparent shadow-none"
            title={
              activeTab === "oportunidades"
                ? "Nenhuma oportunidade"
                : activeTab === "propostas"
                  ? "Nenhuma proposta"
                  : "Nenhum follow-up"
            }
            description={
              hasFilters
                ? "Ajuste os filtros para ver outros registros."
                : activeTab === "oportunidades"
                  ? "Crie uma oportunidade ou aguarde leads do site."
                  : activeTab === "propostas"
                    ? "Crie uma proposta a partir de uma oportunidade."
                    : "Agende follow-ups nas oportunidades."
            }
            action={
              canManage && activeTab === "oportunidades" && !hasFilters
                ? {
                    label: "Nova oportunidade",
                    onClick: () => {
                      setEditOpp(null);
                      setOppFormOpen(true);
                    },
                  }
                : undefined
            }
          />
        ) : (
          <>
            <div className="hidden lg:block overflow-x-hidden">
              <table className="colaboradores-empresa-table comercial-clinica-table">
                <thead>
                  {activeTab === "oportunidades" && (
                    <tr>
                      <th>Empresa / prospect</th>
                      <th>Contato</th>
                      <th>Interesse</th>
                      <th>Etapa</th>
                      <th>Próximo follow-up</th>
                      <th>Responsável</th>
                      <th>Ações</th>
                    </tr>
                  )}
                  {activeTab === "propostas" && (
                    <tr>
                      <th>Empresa / prospect</th>
                      <th>Serviços</th>
                      <th>Valor</th>
                      <th>Emissão</th>
                      <th>Validade</th>
                      <th>Status</th>
                      <th>Responsável</th>
                      <th>Ações</th>
                    </tr>
                  )}
                  {activeTab === "followups" && (
                    <tr>
                      <th>Data</th>
                      <th>Empresa / prospect</th>
                      <th>Contato</th>
                      <th>Ação prevista</th>
                      <th>Responsável</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === "oportunidades" &&
                    initialItems.filter(isLead).map((item) => {
                      const overdue =
                        !!item.nextFollowUpAt &&
                        isBefore(new Date(item.nextFollowUpAt), startOfDay(new Date()));
                      return (
                        <tr
                          key={item.id}
                          className="comercial-clinica-row cursor-pointer"
                          onClick={() => void openLead(item.id)}
                        >
                          <td>
                            <span className="comercial-clinica-primary">
                              {item.companyName || "Sem empresa"}
                            </span>
                            <span className="comercial-secondary">
                              {item.city || sourceLabel(item.source)}
                            </span>
                          </td>
                          <td>
                            <span className="block font-medium text-slate-800">{item.name}</span>
                            <span className="comercial-secondary">{item.phone || "—"}</span>
                          </td>
                          <td className="comercial-clinica-truncate">
                            {item.serviceInterest || item.subject || "—"}
                          </td>
                          <td>
                            <span className="comercial-stage-pill">
                              {COMMERCIAL_STAGE_LABELS[item.stage]}
                            </span>
                          </td>
                          <td>
                            {item.nextFollowUpAt ? (
                              <span className={cn(overdue && "font-semibold text-rose-600")}>
                                {format(new Date(item.nextFollowUpAt), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </span>
                            ) : (
                              <span className="text-slate-400">Não agendado</span>
                            )}
                          </td>
                          <td>{item.assignedToName || "—"}</td>
                          <td
                            className="comercial-td-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SystemActionMenu items={opportunityActions(item)} />
                          </td>
                        </tr>
                      );
                    })}

                  {activeTab === "propostas" &&
                    initialItems.filter(isQuote).map((item) => (
                      <tr
                        key={item.id}
                        className="comercial-clinica-row cursor-pointer"
                        onClick={() => void openQuote(item.id)}
                      >
                        <td>
                          <span className="comercial-clinica-primary">{item.companyName}</span>
                          <span className="comercial-secondary">{item.quoteNumber}</span>
                        </td>
                        <td className="comercial-clinica-truncate">{item.servicesSummary}</td>
                        <td>{formatCurrency(item.totalAmount)}</td>
                        <td>
                          {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td>
                          {item.validUntil
                            ? format(new Date(item.validUntil), "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
                        </td>
                        <td>{QUOTE_STATUS_LABELS[item.status]}</td>
                        <td>{item.createdByName || item.responsibleName || "—"}</td>
                        <td
                          className="comercial-td-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SystemActionMenu items={proposalActions(item)} />
                        </td>
                      </tr>
                    ))}

                  {activeTab === "followups" &&
                    initialItems.filter(isFollowUp).map((item) => (
                      <tr key={item.id} className="comercial-clinica-row">
                        <td>
                          <span className={cn(item.overdue && "font-semibold text-rose-600")}>
                            {format(new Date(item.dueAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </td>
                        <td className="comercial-clinica-primary">
                          {item.companyName || "Sem empresa"}
                        </td>
                        <td>
                          <span className="block">{item.contactName}</span>
                          <span className="comercial-secondary">{item.contactPhone || "—"}</span>
                        </td>
                        <td>{item.action}</td>
                        <td>{item.assignedToName || "—"}</td>
                        <td>
                          {FOLLOW_UP_STATUS_LABELS[item.status]}
                          {item.overdue ? " · atrasado" : ""}
                        </td>
                        <td className="comercial-td-actions">
                          <SystemActionMenu items={followUpActions(item)} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-2 p-3">
              {activeTab === "oportunidades" &&
                initialItems.filter(isLead).map((item) => (
                  <div key={item.id} className="comercial-clinica-mobile-card">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => void openLead(item.id)}
                    >
                      <span className="comercial-clinica-primary">
                        {item.companyName || "Sem empresa"}
                      </span>
                      <span className="comercial-secondary block">
                        {item.name} · {item.phone || "—"}
                      </span>
                      <span className="mt-1 inline-flex comercial-stage-pill">
                        {COMMERCIAL_STAGE_LABELS[item.stage]}
                      </span>
                    </button>
                    {canManage && <SystemActionMenu items={opportunityActions(item)} />}
                  </div>
                ))}
              {activeTab === "propostas" &&
                initialItems.filter(isQuote).map((item) => (
                  <div key={item.id} className="comercial-clinica-mobile-card">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => void openQuote(item.id)}
                    >
                      <span className="comercial-clinica-primary">{item.companyName}</span>
                      <span className="comercial-secondary block">
                        {item.quoteNumber} · {QUOTE_STATUS_LABELS[item.status]}
                      </span>
                      <span className="block text-sm text-slate-700">
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </button>
                    {canManage && <SystemActionMenu items={proposalActions(item)} />}
                  </div>
                ))}
              {activeTab === "followups" &&
                initialItems.filter(isFollowUp).map((item) => (
                  <div key={item.id} className="comercial-clinica-mobile-card">
                    <div className="min-w-0 flex-1">
                      <span className={cn("block font-medium", item.overdue && "text-rose-600")}>
                        {format(new Date(item.dueAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      <span className="comercial-clinica-primary block">
                        {item.companyName || "Sem empresa"}
                      </span>
                      <span className="comercial-secondary block">{item.action}</span>
                    </div>
                    {canManage && <SystemActionMenu items={followUpActions(item)} />}
                  </div>
                ))}
            </div>
          </>
        )}

        {initialTotal > 0 && (
          <div className="comercial-pagination">
            <label className="comercial-page-size">
              <span>Linhas</span>
              <select
                value={String(pageSize)}
                onChange={(e) => updateFilters({ pageSize: e.target.value })}
              >
                {COMMERCIAL_PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-slate-500">
              {rangeFrom}–{rangeTo} de {initialTotal}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={initialPage <= 1 || isPending}
                onClick={() =>
                  updateFilters({ page: String(initialPage - 1) }, { resetPage: false })
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={initialPage >= totalPages || isPending}
                onClick={() =>
                  updateFilters({ page: String(initialPage + 1) }, { resetPage: false })
                }
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <SystemModalShell
        open={!!detailLead || detailLoading}
        onOpenChange={(open) => {
          if (!open) setDetailLead(null);
        }}
        title={detailLead?.companyName || detailLead?.name || "Oportunidade"}
        description="Detalhes, contatos, propostas e follow-ups da oportunidade."
        badges={[
          { label: "Oportunidade", variant: "category" },
          detailLead
            ? { label: COMMERCIAL_STAGE_LABELS[detailLead.stage], variant: "status" }
            : { label: "Carregando", variant: "status" },
        ]}
        className="max-w-3xl"
        footer={
          detailLead && canManage ? (
            <div className="collaborator-modal-actions flex-wrap">
              <Button
                variant="outline"
                className="collaborator-modal-btn"
                onClick={() => {
                  setEditOpp(detailLead);
                  setOppFormOpen(true);
                }}
              >
                Editar
              </Button>
              <Button
                variant="outline"
                className="collaborator-modal-btn"
                onClick={() => setContactLeadId(detailLead.id)}
              >
                Registrar contato
              </Button>
              <Button
                variant="outline"
                className="collaborator-modal-btn"
                onClick={() => setScheduleLeadId(detailLead.id)}
              >
                Agendar follow-up
              </Button>
              <Button
                variant="outline"
                className="collaborator-modal-btn"
                onClick={() => void createProposalFromLead(detailLead.id)}
              >
                Criar proposta
              </Button>
              {detailLead.stage === "GANHO" && !detailLead.companyId && (
                <Button
                  variant="brand"
                  className="collaborator-modal-btn"
                  onClick={() => setConvertOpp(detailLead)}
                >
                  <Building2 className="mr-1 h-4 w-4" />
                  Converter em empresa
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {detailLoading && !detailLead ? (
          <div className="flex justify-center py-10">
            <LoadingState label="Carregando..." />
          </div>
        ) : detailLead ? (
          <LeadDetailContent lead={detailLead} />
        ) : null}
      </SystemModalShell>

      <SystemModalShell
        open={!!detailQuote}
        onOpenChange={(open) => {
          if (!open) setDetailQuote(null);
        }}
        title={detailQuote?.quoteNumber || "Proposta"}
        description={detailQuote?.companyName}
        badges={[{ label: "Proposta", variant: "category" }]}
        className="max-w-3xl"
        footer={
          detailQuote ? (
            <div className="collaborator-modal-actions">
              <Button
                variant="outline"
                className="collaborator-modal-btn"
                onClick={() =>
                  window.open(
                    `/dashboard/orcamentos/orcamento/${detailQuote.id}/imprimir`,
                    "_blank"
                  )
                }
              >
                PDF
              </Button>
              <Button
                variant="brand"
                className="collaborator-modal-btn"
                onClick={() => setDetailQuote(null)}
              >
                Fechar
              </Button>
            </div>
          ) : (
            <div />
          )
        }
      >
        {detailQuote && <QuoteDetailContent quote={detailQuote} />}
      </SystemModalShell>

      <OpportunityFormDialog
        open={oppFormOpen}
        onOpenChange={(open) => {
          setOppFormOpen(open);
          if (!open) setEditOpp(null);
        }}
        opportunity={editOpp}
        assignees={assignees}
        onSuccess={() => refresh()}
      />

      <QuoteFormDialog
        open={quoteFormOpen}
        onOpenChange={(open) => {
          setQuoteFormOpen(open);
          if (!open) {
            setEditQuote(null);
            setQuoteSourceLeadId(undefined);
            setQuotePrefill(undefined);
          }
        }}
        quote={editQuote}
        companies={companies}
        opportunities={opportunities}
        sourceLeadId={quoteSourceLeadId}
        prefill={quotePrefill}
        onSuccess={() => refresh()}
      />

      <RegisterContactDialog
        open={!!contactLeadId}
        onOpenChange={(open) => !open && setContactLeadId(null)}
        leadId={contactLeadId}
        onSuccess={refresh}
      />
      <ScheduleFollowUpDialog
        open={!!scheduleLeadId}
        onOpenChange={(open) => !open && setScheduleLeadId(null)}
        leadId={scheduleLeadId}
        assignees={assignees}
        onSuccess={refresh}
      />
      <MarkLostDialog
        open={!!lostLeadId}
        onOpenChange={(open) => !open && setLostLeadId(null)}
        leadId={lostLeadId}
        onSuccess={refresh}
      />
      <ConvertCompanyDialog
        open={!!convertOpp}
        onOpenChange={(open) => !open && setConvertOpp(null)}
        opportunity={convertOpp}
        onSuccess={(companyId) => {
          refresh();
          router.push(`/dashboard/empresas/${companyId}`);
        }}
      />
      <CompleteFollowUpDialog
        open={!!completeFollowUpId}
        onOpenChange={(open) => !open && setCompleteFollowUpId(null)}
        followUpId={completeFollowUpId}
        onSuccess={refresh}
      />
      <RescheduleFollowUpDialog
        open={!!rescheduleFollowUpId}
        onOpenChange={(open) => !open && setRescheduleFollowUpId(null)}
        followUpId={rescheduleFollowUpId}
        onSuccess={refresh}
      />
      <RejectQuoteDialog
        open={!!rejectQuoteId}
        onOpenChange={(open) => !open && setRejectQuoteId(null)}
        quoteId={rejectQuoteId ?? ""}
        onSuccess={refresh}
      />

      <SystemModalShell
        open={!!noteFollowUpId}
        onOpenChange={(open) => !open && setNoteFollowUpId(null)}
        title="Registrar observação"
        description="A anotação ficará na linha do tempo da oportunidade."
        badges={[{ label: "Anotação", variant: "status" }]}
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setNoteFollowUpId(null)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={async () => {
                if (!noteFollowUpId) return;
                const result = await addCommercialNote("LEAD", noteFollowUpId, noteText);
                if (!result.success) return toast.error(result.error);
                toast.success("Observação registrada.");
                setNoteFollowUpId(null);
                refresh();
              }}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <textarea
          className="w-full rounded-lg border border-slate-200 p-3 text-sm"
          rows={4}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
      </SystemModalShell>
    </PageModule>
  );
}
