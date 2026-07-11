"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  Eye,
  MessageCircle,
  FileText,
  Archive,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Mail,
  Check,
  X,
  Printer,
  Inbox,
  SlidersHorizontal,
  Sparkles,
  Handshake,
  Hourglass,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import type {
  CommercialTab,
  LeadListItem,
  QuoteListItem,
  ContactListItem,
  CommercialHistoryItem,
  LeadDetailSerialized,
  QuoteDetailSerialized,
  ContactDetailSerialized,
} from "@/lib/commercial";
import {
  COMMERCIAL_KPI_CARDS,
  LEAD_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_FILTER_OPTIONS,
  CONTACT_STATUS_LABELS,
  COMMERCIAL_HISTORY_LABELS,
  SUGGESTED_QUOTE_SERVICES,
  formatCurrency,
  buildQuoteWhatsAppMessage,
  buildQuoteEmail,
  buildLeadWhatsAppMessage,
} from "@/lib/commercial";
import {
  getLeadDetail,
  getQuoteDetail,
  getContactDetail,
  updateLeadStatusCommercial,
  updateQuoteStatusCommercial,
  recordWhatsAppOpened,
  recordEmailSent,
  createCommercialLeadFromContact,
  addCommercialNote,
} from "@/actions/commercial";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { buildFilterChips, removeFilterKey } from "@/lib/filter-chips-utils";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  LeadDetailContent,
  QuoteDetailContent,
  ContactDetailContent,
} from "./CommercialDetailContent";
import { QuoteFormDialog, RejectQuoteDialog } from "./CommercialDialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SystemActionMenu,
  type SystemActionItem,
} from "@/components/dashboard/SystemActionMenu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPhone } from "@/lib/helpers";
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

type AssigneeOption = { id: string; name: string };

type OrcamentosClientProps = {
  initialItems: LeadListItem[] | QuoteListItem[] | ContactListItem[] | CommercialHistoryItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  canManage: boolean;
  companies: CompanyOption[];
  assignees: AssigneeOption[];
  activeTab: CommercialTab;
  filters: Record<string, string | undefined>;
};

const TABS: { id: CommercialTab; label: string }[] = [
  { id: "solicitacoes", label: "Solicitações" },
  { id: "orcamentos", label: "Orçamentos" },
  { id: "contatos", label: "Contatos" },
  { id: "historico", label: "Histórico" },
];

const STAT_ICONS: Record<string, LucideIcon> = {
  solicitacoes_novas: Sparkles,
  em_negociacao: Handshake,
  aguardando_resposta: Hourglass,
  aprovados: BadgeCheck,
};

const STAT_TONES: Record<string, "primary" | "warning"> = {
  solicitacoes_novas: "primary",
  em_negociacao: "primary",
  aguardando_resposta: "warning",
  aprovados: "primary",
};

const SOURCE_OPTIONS = [
  { value: "site", label: "Site" },
  { value: "site_contato", label: "Formulário de contato" },
  { value: "indicacao", label: "Indicação" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "manual", label: "Manual" },
];

export function OrcamentosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  canManage,
  companies,
  assignees,
  activeTab,
  filters,
}: OrcamentosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [companyId, setCompanyId] = useState(filters.companyId ?? "");
  const [origem, setOrigem] = useState(filters.origem ?? "");
  const [assignedTo, setAssignedTo] = useState(filters.assignedTo ?? "");
  const [service, setService] = useState(filters.service ?? "");
  const [retorno, setRetorno] = useState(filters.retorno ?? "");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    Boolean(
      filters.companyId ||
        filters.origem ||
        filters.assignedTo ||
        filters.service ||
        filters.retorno
    )
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"lead" | "quote" | "contact">("lead");
  const [detailLoading, setDetailLoading] = useState(false);
  const [leadDetail, setLeadDetail] = useState<LeadDetailSerialized | null>(null);
  const [quoteDetail, setQuoteDetail] = useState<QuoteDetailSerialized | null>(null);
  const [contactDetail, setContactDetail] = useState<ContactDetailSerialized | null>(null);
  const [noteText, setNoteText] = useState("");

  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [editQuote, setEditQuote] = useState<QuoteDetailSerialized | null>(null);
  const [sourceLeadId, setSourceLeadId] = useState<string | undefined>();
  const [quotePrefill, setQuotePrefill] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectQuoteId, setRejectQuoteId] = useState("");

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
      startTransition(() => router.push(`/dashboard/orcamentos?${params.toString()}`));
    },
    [router, searchParams]
  );

  const pushCurrentFilters = (extra?: Record<string, string | undefined>) => {
    updateFilters({
      q: q || undefined,
      status: status || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      companyId: companyId || undefined,
      origem: origem || undefined,
      assignedTo: assignedTo || undefined,
      service: service || undefined,
      retorno: retorno || undefined,
      card: activeCard || undefined,
      tab: activeTab,
      ...extra,
    });
  };

  const setTab = (tab: CommercialTab) =>
    updateFilters({
      tab,
      page: undefined,
      card: undefined,
      status: undefined,
      retorno: undefined,
    });

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setCompanyId("");
    setOrigem("");
    setAssignedTo("");
    setService("");
    setRetorno("");
    setMoreFiltersOpen(false);
    startTransition(() => router.push(`/dashboard/orcamentos?tab=${activeTab}`));
  };

  useEffect(() => {
    setQ(filters.q ?? "");
    setStatus(filters.status ?? "");
    setDateFrom(filters.dateFrom ?? "");
    setDateTo(filters.dateTo ?? "");
    setCompanyId(filters.companyId ?? "");
    setOrigem(filters.origem ?? "");
    setAssignedTo(filters.assignedTo ?? "");
    setService(filters.service ?? "");
    setRetorno(filters.retorno ?? "");
  }, [filters]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.q ||
          filters.status ||
          filters.dateFrom ||
          filters.dateTo ||
          filters.companyId ||
          filters.origem ||
          filters.assignedTo ||
          filters.service ||
          filters.retorno ||
          filters.card
      ),
    [filters]
  );

  const advancedFilterCount = [
    filters.companyId,
    filters.origem,
    filters.assignedTo,
    filters.service,
    filters.retorno,
  ].filter(Boolean).length;

  const activeChips = useMemo(
    () =>
      buildFilterChips([
        { key: "q", value: filters.q, label: (v) => `Busca: ${v}` },
        {
          key: "card",
          value: filters.card,
          label: (v) =>
            COMMERCIAL_KPI_CARDS.find((c) => c.filter === v)?.label ??
            (v === "QUOTE_RECUSADO"
              ? "Recusados"
              : v === "CONTACT_NOVO"
                ? "Contatos sem retorno"
                : `Indicador: ${v}`),
          skip: (v) => v === "ALL",
        },
        {
          key: "status",
          value: filters.status,
          label: (v) => {
            if (activeTab === "orcamentos")
              return `Status: ${QUOTE_STATUS_LABELS[v as keyof typeof QUOTE_STATUS_LABELS] ?? v}`;
            if (activeTab === "contatos")
              return `Situação: ${CONTACT_STATUS_LABELS[v as keyof typeof CONTACT_STATUS_LABELS] ?? v}`;
            return `Status: ${LEAD_STATUS_LABELS[v as keyof typeof LEAD_STATUS_LABELS] ?? v}`;
          },
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
          key: "companyId",
          value: filters.companyId,
          label: (v) => {
            const c = companies.find((x) => x.id === v);
            return `Empresa: ${c ? c.tradeName ?? c.legalName : v}`;
          },
        },
        {
          key: "origem",
          value: filters.origem,
          label: (v) =>
            `Origem: ${SOURCE_OPTIONS.find((o) => o.value === v)?.label ?? v}`,
        },
        {
          key: "assignedTo",
          value: filters.assignedTo,
          label: (v) =>
            `Responsável: ${assignees.find((a) => a.id === v)?.name ?? v}`,
        },
        { key: "service", value: filters.service, label: (v) => `Serviço: ${v}` },
        {
          key: "retorno",
          value: filters.retorno,
          label: (v) =>
            v === "aguardando"
              ? "Situação: Aguardando retorno"
              : "Situação: Contatos sem retorno",
        },
      ]),
    [filters, activeTab, companies, assignees]
  );

  const removeChip = (key: string) => {
    if (key === "q") setQ("");
    if (key === "status") setStatus("");
    if (key === "companyId") setCompanyId("");
    if (key === "origem") setOrigem("");
    if (key === "assignedTo") setAssignedTo("");
    if (key === "service") setService("");
    if (key === "retorno") setRetorno("");
    if (key === "dateFrom") {
      setDateFrom("");
      setDateTo("");
      updateFilters({ ...removeFilterKey(key, filters), dateTo: undefined });
      return;
    }
    updateFilters(removeFilterKey(key, filters));
  };

  const openLead = async (id: string) => {
    setDrawerType("lead");
    setDrawerOpen(true);
    setDetailLoading(true);
    const r = await getLeadDetail(id);
    setDetailLoading(false);
    if (!r.success) {
      toast.error(r.error);
      setDrawerOpen(false);
      return;
    }
    setLeadDetail(r.lead);
  };

  const openQuote = async (id: string) => {
    setDrawerType("quote");
    setDrawerOpen(true);
    setDetailLoading(true);
    const r = await getQuoteDetail(id);
    setDetailLoading(false);
    if (!r.success) {
      toast.error(r.error);
      setDrawerOpen(false);
      return;
    }
    setQuoteDetail(r.quote);
  };

  const openContact = async (id: string) => {
    setDrawerType("contact");
    setDrawerOpen(true);
    setDetailLoading(true);
    const r = await getContactDetail(id);
    setDetailLoading(false);
    if (!r.success) {
      toast.error(r.error);
      setDrawerOpen(false);
      return;
    }
    setContactDetail(r.contact);
  };

  const waUrl = (phone: string, message: string) =>
    `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  const handleWhatsAppLead = async (lead: LeadListItem) => {
    if (!lead.phone) return;
    await recordWhatsAppOpened("LEAD", lead.id);
    window.open(waUrl(lead.phone, buildLeadWhatsAppMessage(lead)), "_blank");
  };

  const handleCreateQuoteFromLead = (lead: LeadListItem | LeadDetailSerialized) => {
    setSourceLeadId(lead.id);
    setEditQuote(null);
    setQuotePrefill({
      companyName: lead.companyName ?? "",
      responsibleName: lead.name,
      phone: lead.phone ?? "",
      email: lead.email ?? "",
    });
    setQuoteFormOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("new") === "1" && canManage) setQuoteFormOpen(true);
    const companyIdParam = searchParams.get("companyId");
    if (companyIdParam && companies.length) {
      const c = companies.find((x) => x.id === companyIdParam);
      if (c) {
        setQuotePrefill({
          companyId: c.id,
          companyName: c.tradeName ?? c.legalName,
          responsibleName: c.responsibleName ?? "",
          phone: c.whatsapp ?? "",
          email: c.email ?? "",
        });
        setQuoteFormOpen(true);
      }
    }
    const contactId = searchParams.get("contact");
    if (contactId) openContact(contactId);
  }, [searchParams, canManage, companies]); // eslint-disable-line react-hooks/exhaustive-deps

  const emptyStates: Record<CommercialTab, { title: string; desc: string }> = {
    solicitacoes: {
      title: "Nenhuma solicitação comercial recebida",
      desc: "As solicitações de orçamento enviadas pelo site aparecerão aqui.",
    },
    orcamentos: {
      title: "Nenhum orçamento cadastrado",
      desc: "Crie uma proposta para uma empresa ou converta uma solicitação em orçamento.",
    },
    contatos: {
      title: "Nenhuma mensagem recebida",
      desc: "As mensagens do formulário de contato aparecerão aqui.",
    },
    historico: {
      title: "Nenhum registro comercial",
      desc: "O histórico de ações comerciais aparecerá aqui.",
    },
  };

  const isEmpty = initialItems.length === 0 && !hasActiveFilters;
  const resultLabel =
    initialTotal === 1 ? "1 registro encontrado" : `${initialTotal} registros encontrados`;

  const statusOptions =
    activeTab === "orcamentos"
      ? QUOTE_STATUS_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
      : activeTab === "contatos"
        ? Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
        : Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <PageModule className="comercial-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Comercial</h1>
          <p className="colaboradores-empresa-subtitle">
            Gerencie solicitações, propostas, contatos e oportunidades comerciais.
          </p>
        </div>
        {canManage && (
          <div className="colaboradores-empresa-header-actions">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setTab("contatos")}
            >
              <Inbox className="mr-2 h-4 w-4" />
              Registrar contato
            </Button>
            <Button
              variant="brand"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setEditQuote(null);
                setSourceLeadId(undefined);
                setQuoteFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo orçamento
            </Button>
          </div>
        )}
      </header>

      <div className="colaboradores-empresa-stats comercial-clinica-stats">
        {COMMERCIAL_KPI_CARDS.map((card) => {
          const Icon = STAT_ICONS[card.key] ?? DollarSign;
          const isActive = activeCard === card.filter;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() =>
                updateFilters({
                  card: isActive ? undefined : card.filter,
                  tab: card.tab,
                  status: undefined,
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
                  {statCounts[card.key] ?? 0}
                </span>
                <span className="colaboradores-empresa-stat-title">{card.label}</span>
                <span className="colaboradores-empresa-stat-hint">{card.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <nav className="comercial-clinica-tabs" aria-label="Abas comerciais">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "comercial-clinica-tab",
              activeTab === t.id && "comercial-clinica-tab--active"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="colaboradores-empresa-filters">
        <div className="colaboradores-empresa-filters-row">
          <div className="colaboradores-empresa-search">
            <Search className="colaboradores-empresa-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pushCurrentFilters()}
              placeholder="Buscar por nome, empresa, telefone, serviço ou orçamento"
              aria-label="Buscar"
              className="colaboradores-empresa-search-input"
            />
          </div>

          {activeTab !== "historico" && (
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
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              const value = e.target.value;
              setDateFrom(value);
              pushCurrentFilters({ dateFrom: value || undefined });
            }}
            aria-label="Período — início"
            className="h-9 rounded-lg text-sm"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              const value = e.target.value;
              setDateTo(value);
              pushCurrentFilters({ dateTo: value || undefined });
            }}
            aria-label="Período — fim"
            className="h-9 rounded-lg text-sm"
          />

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
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Empresa"
            >
              <option value="">Empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName ?? c.legalName}
                </option>
              ))}
            </select>

            <select
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Origem"
            >
              <option value="">Origem</option>
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Responsável"
            >
              <option value="">Responsável</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Serviço"
            >
              <option value="">Serviço</option>
              {SUGGESTED_QUOTE_SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={retorno}
              onChange={(e) => setRetorno(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Situação do retorno"
            >
              <option value="">Situação do retorno</option>
              <option value="aguardando">Aguardando retorno</option>
              <option value="sem_retorno">Contatos sem retorno</option>
            </select>

            <Button
              type="button"
              variant="brand"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                if (retorno === "sem_retorno") {
                  pushCurrentFilters({
                    tab: "contatos",
                    retorno: "sem_retorno",
                    card: "CONTACT_NOVO",
                  });
                  return;
                }
                pushCurrentFilters();
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
        {isPending && <LoadingState overlay label="Atualizando comercial..." />}

        <div className="colaboradores-empresa-result-bar">
          <span className="text-xs text-slate-500">{resultLabel}</span>
        </div>

        {isEmpty ? (
          <EmptyState
            icon={DollarSign}
            title={emptyStates[activeTab].title}
            description={emptyStates[activeTab].desc}
            action={
              canManage && activeTab === "orcamentos"
                ? { label: "Novo orçamento", onClick: () => setQuoteFormOpen(true) }
                : undefined
            }
          />
        ) : activeTab === "historico" ? (
          <ol className="comercial-clinica-timeline">
            {(initialItems as CommercialHistoryItem[]).map((item) => (
              <li key={item.id} className="comercial-clinica-timeline-item">
                <span className="comercial-clinica-timeline-dot" aria-hidden />
                <div className="comercial-clinica-timeline-body">
                  <div className="comercial-clinica-timeline-head">
                    <strong>{COMMERCIAL_HISTORY_LABELS[item.action] ?? item.action}</strong>
                    <span>
                      {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p>{item.entityLabel}</p>
                  <p className="comercial-clinica-timeline-meta">
                    {item.performedByName ?? "Sistema"}
                    {item.fromStatus && item.toStatus
                      ? ` · ${item.fromStatus} → ${item.toStatus}`
                      : ""}
                  </p>
                  {item.notes && <p className="comercial-clinica-timeline-notes">{item.notes}</p>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <>
            <div className="colaboradores-empresa-table-scroll">
              <table className="colaboradores-empresa-table comercial-clinica-table">
                <thead>
                  {activeTab === "solicitacoes" && (
                    <tr>
                      <th>Contato</th>
                      <th>Empresa</th>
                      <th>Telefone</th>
                      <th>Serviço solicitado</th>
                      <th>Origem</th>
                      <th>Data</th>
                      <th>Responsável</th>
                      <th>Status</th>
                      <th className="colaboradores-empresa-th-actions">Ações</th>
                    </tr>
                  )}
                  {activeTab === "orcamentos" && (
                    <tr>
                      <th>Número do orçamento</th>
                      <th>Empresa ou cliente</th>
                      <th>Valor</th>
                      <th>Data de envio</th>
                      <th>Validade</th>
                      <th>Responsável</th>
                      <th>Status</th>
                      <th className="colaboradores-empresa-th-actions">Ações</th>
                    </tr>
                  )}
                  {activeTab === "contatos" && (
                    <tr>
                      <th>Nome</th>
                      <th>Empresa</th>
                      <th>Telefone</th>
                      <th>Último contato</th>
                      <th>Próximo retorno</th>
                      <th>Responsável</th>
                      <th>Situação</th>
                      <th className="colaboradores-empresa-th-actions">Ações</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === "solicitacoes" &&
                    (initialItems as LeadListItem[]).map((item) => (
                      <tr
                        key={item.id}
                        className="comercial-clinica-row cursor-pointer"
                        onClick={() => openLead(item.id)}
                      >
                        <td className="comercial-clinica-primary">{item.name}</td>
                        <td>{item.companyName ?? "—"}</td>
                        <td className="whitespace-nowrap">
                          {item.phone ? formatPhone(item.phone) : "—"}
                        </td>
                        <td className="comercial-clinica-truncate">
                          {item.serviceInterest ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-xs text-slate-500">
                          {item.source}
                        </td>
                        <td className="whitespace-nowrap">
                          {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="whitespace-nowrap">
                          {item.assignedToName ?? "—"}
                        </td>
                        <td>
                          <StatusBadge status={item.status} type="lead" />
                        </td>
                        <td
                          className="colaboradores-empresa-td-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SystemActionMenu
                            items={
                              [
                                {
                                  label: "Ver detalhes",
                                  hint: "Abrir solicitação",
                                  icon: Eye,
                                  iconTone: "view",
                                  onClick: () => openLead(item.id),
                                },
                                item.phone
                                  ? {
                                      label: "WhatsApp",
                                      hint: "Contatar lead",
                                      icon: MessageCircle,
                                      iconTone: "schedule",
                                      onClick: () => handleWhatsAppLead(item),
                                    }
                                  : null,
                                canManage
                                  ? {
                                      label: "Criar orçamento",
                                      hint: "Nova proposta",
                                      icon: FileText,
                                      iconTone: "quote",
                                      onClick: () => handleCreateQuoteFromLead(item),
                                    }
                                  : null,
                                canManage
                                  ? {
                                      label: "Arquivar",
                                      hint: "Encerrar solicitação",
                                      icon: Archive,
                                      iconTone: "cancel",
                                      onClick: async () => {
                                        await updateLeadStatusCommercial(
                                          item.id,
                                          "ARQUIVADO"
                                        );
                                        router.refresh();
                                      },
                                    }
                                  : null,
                              ].filter(Boolean) as SystemActionItem[]
                            }
                          />
                        </td>
                      </tr>
                    ))}

                  {activeTab === "orcamentos" &&
                    (initialItems as QuoteListItem[]).map((item) => (
                      <tr
                        key={item.id}
                        className="comercial-clinica-row cursor-pointer"
                        onClick={() => openQuote(item.id)}
                      >
                        <td className="comercial-clinica-protocol">{item.quoteNumber}</td>
                        <td className="comercial-clinica-primary">{item.companyName}</td>
                        <td className="whitespace-nowrap">
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td className="whitespace-nowrap">
                          {item.sentAt
                            ? format(new Date(item.sentAt), "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap">
                          {item.validUntil
                            ? format(new Date(item.validUntil), "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap">
                          {item.responsibleName ?? "—"}
                        </td>
                        <td>
                          <StatusBadge status={item.status} type="quote" />
                        </td>
                        <td
                          className="colaboradores-empresa-td-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SystemActionMenu
                            items={
                              [
                                {
                                  label: "Ver orçamento",
                                  hint: "Abrir proposta",
                                  icon: Eye,
                                  iconTone: "view",
                                  onClick: () => openQuote(item.id),
                                },
                                canManage
                                  ? {
                                      label: "Editar",
                                      hint: "Alterar proposta",
                                      icon: FileText,
                                      iconTone: "docs",
                                      onClick: async () => {
                                        const r = await getQuoteDetail(item.id);
                                        if (r.success) {
                                          setEditQuote(r.quote);
                                          setQuoteFormOpen(true);
                                        }
                                      },
                                    }
                                  : null,
                                canManage && item.status !== "APROVADO"
                                  ? {
                                      label: "Aprovar",
                                      hint: "Marcar como aprovado",
                                      icon: Check,
                                      iconTone: "done",
                                      onClick: async () => {
                                        await updateQuoteStatusCommercial(
                                          item.id,
                                          "APROVADO"
                                        );
                                        router.refresh();
                                      },
                                    }
                                  : null,
                                canManage && item.status !== "RECUSADO"
                                  ? {
                                      label: "Recusar",
                                      hint: "Registrar recusa",
                                      icon: X,
                                      iconTone: "cancel",
                                      onClick: () => {
                                        setRejectQuoteId(item.id);
                                        setRejectOpen(true);
                                      },
                                    }
                                  : null,
                                {
                                  label: "Gerar PDF",
                                  hint: "Imprimir proposta",
                                  icon: Printer,
                                  iconTone: "docs",
                                  onClick: () =>
                                    window.open(
                                      `/dashboard/orcamentos/orcamento/${item.id}/imprimir`,
                                      "_blank"
                                    ),
                                },
                              ].filter(Boolean) as SystemActionItem[]
                            }
                          />
                        </td>
                      </tr>
                    ))}

                  {activeTab === "contatos" &&
                    (initialItems as ContactListItem[]).map((item) => (
                      <tr
                        key={item.id}
                        className="comercial-clinica-row cursor-pointer"
                        onClick={() => openContact(item.id)}
                      >
                        <td className="comercial-clinica-primary">{item.name}</td>
                        <td>{item.company ?? "—"}</td>
                        <td className="whitespace-nowrap">{formatPhone(item.phone)}</td>
                        <td className="whitespace-nowrap">
                          {format(new Date(item.updatedAt || item.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </td>
                        <td>—</td>
                        <td>—</td>
                        <td>
                          <StatusBadge
                            status={item.status}
                            type="contact"
                            label={CONTACT_STATUS_LABELS[item.status]}
                          />
                        </td>
                        <td
                          className="colaboradores-empresa-td-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SystemActionMenu
                            items={
                              [
                                {
                                  label: "Ver mensagem",
                                  hint: "Abrir contato",
                                  icon: Eye,
                                  iconTone: "view",
                                  onClick: () => openContact(item.id),
                                },
                                {
                                  label: "WhatsApp",
                                  hint: "Contatar lead",
                                  icon: MessageCircle,
                                  iconTone: "schedule",
                                  onClick: () =>
                                    window.open(
                                      waUrl(item.phone, `Olá ${item.name}!`),
                                      "_blank"
                                    ),
                                },
                                canManage
                                  ? {
                                      label: "Criar solicitação",
                                      hint: "Novo lead comercial",
                                      icon: FileText,
                                      iconTone: "quote",
                                      onClick: async () => {
                                        const r = await createCommercialLeadFromContact(
                                          item.id
                                        );
                                        if (r.success)
                                          toast.success("Solicitação criada.");
                                        router.refresh();
                                      },
                                    }
                                  : null,
                              ].filter(Boolean) as SystemActionItem[]
                            }
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="colaboradores-empresa-mobile-list">
              {activeTab === "solicitacoes" &&
                (initialItems as LeadListItem[]).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="comercial-clinica-mobile-card"
                    onClick={() => openLead(item.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="comercial-clinica-primary">{item.name}</span>
                      <StatusBadge status={item.status} type="lead" />
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.companyName ?? "—"} · {item.serviceInterest ?? "—"}
                    </p>
                  </button>
                ))}
              {activeTab === "orcamentos" &&
                (initialItems as QuoteListItem[]).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="comercial-clinica-mobile-card"
                    onClick={() => openQuote(item.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="comercial-clinica-protocol">{item.quoteNumber}</span>
                      <StatusBadge status={item.status} type="quote" />
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.companyName} · {formatCurrency(item.totalAmount)}
                    </p>
                  </button>
                ))}
              {activeTab === "contatos" &&
                (initialItems as ContactListItem[]).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="comercial-clinica-mobile-card"
                    onClick={() => openContact(item.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="comercial-clinica-primary">{item.name}</span>
                      <StatusBadge
                        status={item.status}
                        type="contact"
                        label={CONTACT_STATUS_LABELS[item.status]}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.company ?? "—"} · {formatPhone(item.phone)}
                    </p>
                  </button>
                ))}
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
            <SheetTitle>Detalhe</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {detailLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
              </div>
            ) : (
              <>
                {drawerType === "lead" && leadDetail && <LeadDetailContent lead={leadDetail} />}
                {drawerType === "quote" && quoteDetail && (
                  <QuoteDetailContent quote={quoteDetail} />
                )}
                {drawerType === "contact" && contactDetail && (
                  <ContactDetailContent contact={contactDetail} />
                )}
                {canManage && drawerType === "lead" && leadDetail && (
                  <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
                    {leadDetail.phone && (
                      <Button
                        size="sm"
                        variant="brand"
                        onClick={() => handleWhatsAppLead(leadDetail)}
                      >
                        <MessageCircle className="mr-1 h-4 w-4" />
                        WhatsApp
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateQuoteFromLead(leadDetail)}
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      Criar orçamento
                    </Button>
                  </div>
                )}
                {canManage && drawerType === "quote" && quoteDetail && (
                  <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `/dashboard/orcamentos/orcamento/${quoteDetail.id}/imprimir`,
                          "_blank"
                        )
                      }
                    >
                      <Printer className="mr-1 h-4 w-4" />
                      PDF
                    </Button>
                    {quoteDetail.phone && (
                      <Button
                        size="sm"
                        variant="brand"
                        onClick={async () => {
                          await recordWhatsAppOpened("QUOTE", quoteDetail.id);
                          const pdfUrl = `${window.location.origin}/dashboard/orcamentos/orcamento/${quoteDetail.id}/imprimir`;
                          window.open(
                            waUrl(
                              quoteDetail.phone!,
                              buildQuoteWhatsAppMessage({ ...quoteDetail, pdfUrl })
                            ),
                            "_blank"
                          );
                        }}
                      >
                        <MessageCircle className="mr-1 h-4 w-4" />
                        WhatsApp
                      </Button>
                    )}
                    {quoteDetail.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const mail = buildQuoteEmail(quoteDetail);
                          await recordEmailSent("QUOTE", quoteDetail.id);
                          window.location.href = `mailto:${quoteDetail.email}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;
                        }}
                      >
                        <Mail className="mr-1 h-4 w-4" />
                        E-mail
                      </Button>
                    )}
                  </div>
                )}
                {canManage && (leadDetail || quoteDetail) && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    <Textarea
                      placeholder="Adicionar observação interna..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={2}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const entityType = drawerType === "lead" ? "LEAD" : "QUOTE";
                        const entityId =
                          drawerType === "lead" ? leadDetail!.id : quoteDetail!.id;
                        const r = await addCommercialNote(entityType, entityId, noteText);
                        if (r.success) {
                          setNoteText("");
                          toast.success("Nota adicionada.");
                          drawerType === "lead" ? openLead(entityId) : openQuote(entityId);
                        }
                      }}
                    >
                      Salvar nota
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {canManage && (
        <>
          <QuoteFormDialog
            open={quoteFormOpen}
            onOpenChange={setQuoteFormOpen}
            quote={editQuote}
            companies={companies}
            sourceLeadId={sourceLeadId}
            prefill={quotePrefill}
            onSuccess={(id) => {
              router.refresh();
              if (id) openQuote(id);
            }}
          />
          <RejectQuoteDialog
            open={rejectOpen}
            onOpenChange={setRejectOpen}
            quoteId={rejectQuoteId}
            onSuccess={() => router.refresh()}
          />
        </>
      )}
    </PageModule>
  );
}

