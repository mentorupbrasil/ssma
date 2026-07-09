"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  MessageCircle,
  FileText,
  Archive,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Mail,
  Copy,
  Check,
  X,
  Printer,
  Inbox,
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
  COMMERCIAL_STAT_CARDS,
  LEAD_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  COMMERCIAL_HISTORY_LABELS,
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
  updateContactStatusCommercial,
  updateQuoteStatusCommercial,
  duplicateQuote,
  recordWhatsAppOpened,
  recordEmailSent,
  createCommercialLeadFromContact,
  addCommercialNote,
} from "@/actions/commercial";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageModule } from "@/components/dashboard/PageModule";
import { FilterMetricGrid } from "@/components/dashboard/FilterMetricGrid";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type OrcamentosClientProps = {
  initialItems: LeadListItem[] | QuoteListItem[] | ContactListItem[] | CommercialHistoryItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  canManage: boolean;
  companies: CompanyOption[];
  activeTab: CommercialTab;
  filters: Record<string, string | undefined>;
};

const TABS: { id: CommercialTab; label: string }[] = [
  { id: "solicitacoes", label: "Solicitações" },
  { id: "orcamentos", label: "Orçamentos" },
  { id: "contatos", label: "Contatos" },
  { id: "historico", label: "Histórico comercial" },
];

export function OrcamentosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  canManage,
  companies,
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

  const activeCard = filters.card ?? "ALL";
  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!updates.page) params.delete("page");
      startTransition(() => router.push(`/dashboard/orcamentos?${params.toString()}`));
    },
    [router, searchParams]
  );

  const setTab = (tab: CommercialTab) => updateFilters({ tab, page: undefined, card: undefined });

  const handleSearch = () =>
    updateFilters({ q, status, dateFrom, dateTo, tab: activeTab, card: activeCard !== "ALL" ? activeCard : undefined });

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    startTransition(() => router.push(`/dashboard/orcamentos?tab=${activeTab}`));
  };

  const openLead = async (id: string) => {
    setDrawerType("lead");
    setDrawerOpen(true);
    setDetailLoading(true);
    const r = await getLeadDetail(id);
    setDetailLoading(false);
    if (!r.success) { toast.error(r.error); setDrawerOpen(false); return; }
    setLeadDetail(r.lead);
  };

  const openQuote = async (id: string) => {
    setDrawerType("quote");
    setDrawerOpen(true);
    setDetailLoading(true);
    const r = await getQuoteDetail(id);
    setDetailLoading(false);
    if (!r.success) { toast.error(r.error); setDrawerOpen(false); return; }
    setQuoteDetail(r.quote);
  };

  const openContact = async (id: string) => {
    setDrawerType("contact");
    setDrawerOpen(true);
    setDetailLoading(true);
    const r = await getContactDetail(id);
    setDetailLoading(false);
    if (!r.success) { toast.error(r.error); setDrawerOpen(false); return; }
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
    const companyId = searchParams.get("companyId");
    if (companyId && companies.length) {
      const c = companies.find((x) => x.id === companyId);
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
  }, [searchParams, canManage, companies]);

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
    historico: { title: "Nenhum registro comercial", desc: "O histórico de ações aparecerá aqui." },
  };

  const isEmpty = initialItems.length === 0 && !filters.q && activeCard === "ALL";

  return (
    <PageModule>
      <PageHeader
        title="Orçamentos"
        description="Solicitações comerciais, propostas e leads recebidos pelo site"
      >
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="brand" onClick={() => { setEditQuote(null); setSourceLeadId(undefined); setQuoteFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo orçamento
            </Button>
            <Button variant="outline" onClick={() => setTab("contatos")}>
              <Inbox className="mr-2 h-4 w-4" /> Novo contato
            </Button>
          </div>
        )}
      </PageHeader>

      <FilterMetricGrid
        items={COMMERCIAL_STAT_CARDS.map((card) => {
          const isActive = activeCard === card.filter;
          return {
            key: card.key,
            metaKey: `commercial:${card.key}`,
            label: card.label,
            value: statCounts[card.key] ?? 0,
            active: isActive,
            onClick: () => updateFilters({ card: isActive ? "ALL" : card.filter, tab: activeTab }),
          };
        })}
      />

      <Tabs value={activeTab} onValueChange={(v) => setTab(v as CommercialTab)}>
        <TabsList className="mb-4 h-auto flex-wrap gap-1 bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="rounded-lg border border-slate-200 bg-white px-4 py-2 data-[state=active]:border-[#16A085] data-[state=active]:bg-[#16A085]/10">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <FilterBar onSearch={handleSearch} onClear={clearFilters} isPending={isPending}>
        <div className="referral-filter-search sm:col-span-2">
            <Search className="referral-filter-search-icon h-4 w-4" />
            <Input
              placeholder="Buscar por nome, empresa, telefone, serviço ou número do orçamento"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <select className="referral-filter-select" value={status || "ALL"} onChange={(e) => setStatus(e.target.value === "ALL" ? "" : e.target.value)}>
            <option value="ALL">Status</option>
            {activeTab === "orcamentos"
              ? Object.entries(QUOTE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)
              : activeTab === "contatos"
                ? Object.entries({ NOVO: "Novo", EM_ANALISE: "Em análise", RESPONDIDO: "Respondido", ARQUIVADO: "Arquivado" }).map(([v, l]) => <option key={v} value={v}>{l}</option>)
                : Object.entries(LEAD_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="referral-filter-select" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="referral-filter-select" />
      </FilterBar>

      {isEmpty ? (
        <EmptyState
          icon={DollarSign}
          title={emptyStates[activeTab].title}
          description={emptyStates[activeTab].desc}
          action={
            canManage && activeTab === "orcamentos"
              ? {
                  label: "Novo orçamento",
                  onClick: () => setQuoteFormOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="relative mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          {isPending && <LoadingState overlay label="Atualizando lista..." />}
          <Table>
            <TableHeader>
              {activeTab === "solicitacoes" && (
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Empresa</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">Serviço</TableHead>
                  <TableHead className="hidden xl:table-cell">Origem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              )}
              {activeTab === "orcamentos" && (
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="hidden md:table-cell">Serviços</TableHead>
                  <TableHead className="hidden sm:table-cell">Valor</TableHead>
                  <TableHead className="hidden lg:table-cell">Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              )}
              {activeTab === "contatos" && (
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Empresa</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              )}
              {activeTab === "historico" && (
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {activeTab === "solicitacoes" &&
                (initialItems as LeadListItem[]).map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => openLead(item.id)}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{item.companyName ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{item.phone ? formatPhone(item.phone) : "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[160px] truncate">{item.serviceInterest ?? "—"}</TableCell>
                    <TableCell className="hidden xl:table-cell text-xs">{item.source}</TableCell>
                    <TableCell className="text-sm text-slate-500">{format(new Date(item.createdAt), "dd/MM/yy", { locale: ptBR })}</TableCell>
                    <TableCell><StatusBadge status={item.status} type="lead" /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowMenu>
                        <DropdownMenuItem onClick={() => openLead(item.id)}><Eye className="mr-2 h-4 w-4" />Ver detalhes</DropdownMenuItem>
                        {item.phone && <DropdownMenuItem onClick={() => handleWhatsAppLead(item)}><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</DropdownMenuItem>}
                        {canManage && <DropdownMenuItem onClick={() => handleCreateQuoteFromLead(item)}><FileText className="mr-2 h-4 w-4" />Criar orçamento</DropdownMenuItem>}
                        {canManage && <DropdownMenuItem onClick={async () => { await updateLeadStatusCommercial(item.id, "ARQUIVADO"); router.refresh(); }}><Archive className="mr-2 h-4 w-4" />Arquivar</DropdownMenuItem>}
                      </RowMenu>
                    </TableCell>
                  </TableRow>
                ))}
              {activeTab === "orcamentos" &&
                (initialItems as QuoteListItem[]).map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => openQuote(item.id)}>
                    <TableCell className="font-mono text-sm font-medium">{item.quoteNumber}</TableCell>
                    <TableCell>{item.companyName}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-sm">{item.servicesSummary}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatCurrency(item.totalAmount)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{item.validUntil ? format(new Date(item.validUntil), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell><StatusBadge status={item.status} type="quote" /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowMenu>
                        <DropdownMenuItem onClick={() => openQuote(item.id)}><Eye className="mr-2 h-4 w-4" />Ver orçamento</DropdownMenuItem>
                        {canManage && <DropdownMenuItem onClick={async () => { const r = await getQuoteDetail(item.id); if (r.success) { setEditQuote(r.quote); setQuoteFormOpen(true); } }}><FileText className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>}
                        {canManage && item.status !== "APROVADO" && <DropdownMenuItem onClick={async () => { await updateQuoteStatusCommercial(item.id, "APROVADO"); router.refresh(); }}><Check className="mr-2 h-4 w-4" />Aprovar</DropdownMenuItem>}
                        {canManage && item.status !== "RECUSADO" && <DropdownMenuItem onClick={() => { setRejectQuoteId(item.id); setRejectOpen(true); }}><X className="mr-2 h-4 w-4" />Recusar</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => window.open(`/dashboard/orcamentos/orcamento/${item.id}/imprimir`, "_blank")}><Printer className="mr-2 h-4 w-4" />Gerar PDF</DropdownMenuItem>
                      </RowMenu>
                    </TableCell>
                  </TableRow>
                ))}
              {activeTab === "contatos" &&
                (initialItems as ContactListItem[]).map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => openContact(item.id)}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{item.subject}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatPhone(item.phone)}</TableCell>
                    <TableCell className="hidden md:table-cell">{item.company ?? "—"}</TableCell>
                    <TableCell className="text-sm text-slate-500">{format(new Date(item.createdAt), "dd/MM/yy", { locale: ptBR })}</TableCell>
                    <TableCell><StatusBadge status={item.status} type="contact" /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowMenu>
                        <DropdownMenuItem onClick={() => openContact(item.id)}><Eye className="mr-2 h-4 w-4" />Ver mensagem</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(waUrl(item.phone, `Olá ${item.name}!`), "_blank")}><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</DropdownMenuItem>
                        {canManage && <DropdownMenuItem onClick={async () => { const r = await createCommercialLeadFromContact(item.id); if (r.success) toast.success("Solicitação criada."); router.refresh(); }}><FileText className="mr-2 h-4 w-4" />Criar solicitação</DropdownMenuItem>}
                      </RowMenu>
                    </TableCell>
                  </TableRow>
                ))}
              {activeTab === "historico" &&
                (initialItems as CommercialHistoryItem[]).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">{COMMERCIAL_HISTORY_LABELS[item.action]}</TableCell>
                    <TableCell className="text-sm text-slate-600">{item.entityLabel}</TableCell>
                    <TableCell className="text-sm">{item.performedByName ?? "Sistema"}</TableCell>
                    <TableCell className="text-sm text-slate-500">{format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-slate-500">Página {initialPage} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={initialPage <= 1} onClick={() => updateFilters({ page: String(initialPage - 1) })}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={initialPage >= totalPages} onClick={() => updateFilters({ page: String(initialPage + 1) })}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>Detalhe</SheetTitle></SheetHeader>
          <div className="mt-6">
            {detailLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#16A085]" /></div>
            ) : (
              <>
                {drawerType === "lead" && leadDetail && <LeadDetailContent lead={leadDetail} />}
                {drawerType === "quote" && quoteDetail && <QuoteDetailContent quote={quoteDetail} />}
                {drawerType === "contact" && contactDetail && <ContactDetailContent contact={contactDetail} />}
                {canManage && drawerType === "lead" && leadDetail && (
                  <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
                    {leadDetail.phone && (
                      <Button size="sm" variant="brand" onClick={() => handleWhatsAppLead(leadDetail)}><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleCreateQuoteFromLead(leadDetail)}><FileText className="mr-1 h-4 w-4" />Criar orçamento</Button>
                  </div>
                )}
                {canManage && drawerType === "quote" && quoteDetail && (
                  <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
                    <Button size="sm" variant="outline" onClick={() => window.open(`/dashboard/orcamentos/orcamento/${quoteDetail.id}/imprimir`, "_blank")}><Printer className="mr-1 h-4 w-4" />PDF</Button>
                    {quoteDetail.phone && (
                      <Button size="sm" variant="brand" onClick={async () => {
                        await recordWhatsAppOpened("QUOTE", quoteDetail.id);
                        const pdfUrl = `${window.location.origin}/dashboard/orcamentos/orcamento/${quoteDetail.id}/imprimir`;
                        window.open(waUrl(quoteDetail.phone!, buildQuoteWhatsAppMessage({ ...quoteDetail, pdfUrl })), "_blank");
                      }}><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</Button>
                    )}
                    {quoteDetail.email && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        const mail = buildQuoteEmail(quoteDetail);
                        await recordEmailSent("QUOTE", quoteDetail.id);
                        window.location.href = `mailto:${quoteDetail.email}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;
                      }}><Mail className="mr-1 h-4 w-4" />E-mail</Button>
                    )}
                  </div>
                )}
                {canManage && (leadDetail || quoteDetail) && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    <Textarea placeholder="Adicionar observação interna..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} />
                    <Button size="sm" variant="outline" onClick={async () => {
                      const entityType = drawerType === "lead" ? "LEAD" : "QUOTE";
                      const entityId = drawerType === "lead" ? leadDetail!.id : quoteDetail!.id;
                      const r = await addCommercialNote(entityType, entityId, noteText);
                      if (r.success) { setNoteText(""); toast.success("Nota adicionada."); drawerType === "lead" ? openLead(entityId) : openQuote(entityId); }
                    }}>Salvar nota</Button>
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
            onSuccess={(id) => { router.refresh(); if (id) openQuote(id); }}
          />
          <RejectQuoteDialog open={rejectOpen} onOpenChange={setRejectOpen} quoteId={rejectQuoteId} onSuccess={() => router.refresh()} />
        </>
      )}
    </PageModule>
  );
}

function RowMenu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
