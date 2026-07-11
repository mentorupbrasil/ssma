"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Loader2,
  Search,
  SlidersHorizontal,
  CircleDot,
  Headphones,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useBreadcrumbSegmentLabel } from "@/components/dashboard/BreadcrumbLabelProvider";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  createTicket,
  getTicketDetail,
  addTicketComment,
} from "@/actions/tickets";
import { TICKET_STATUS_LABELS } from "@/lib/tickets";
import { ticketStatCardsForEmpresa } from "@/lib/empresa-portal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TicketItem = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  assignedTo: { id: string; name: string } | null;
  companyName: string | null;
  commentCount: number;
};

type EmpresaChamadosClientProps = {
  items: TicketItem[];
  total: number;
  page: number;
  pageSize: number;
  statCounts: Record<string, number>;
  filters: {
    q?: string;
    status?: string;
    priority?: string;
    card?: string;
    category?: string;
  };
};

const EMPRESA_TICKET_CATEGORIES = [
  "Suporte técnico",
  "Acesso e permissões",
  "Portal empresarial",
  "Importação de colaboradores",
  "Documentos",
  "Outro",
] as const;

const STAT_ICONS = {
  abertos: CircleDot,
  em_atendimento: Headphones,
  resolvidos: CheckCircle2,
} as const;

export function EmpresaChamadosClient({
  items,
  total,
  page,
  pageSize,
  statCounts,
  filters,
}: EmpresaChamadosClientProps) {
  useBreadcrumbSegmentLabel("chamados", "Chamados");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [newCategory, setNewCategory] = useState("");
  const [q, setQ] = useState(filters.q ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  const [category, setCategory] = useState(filters.category ?? "");
  const [priorityFilter, setPriorityFilter] = useState(filters.priority ?? "");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(Boolean(filters.priority));
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getTicketDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeCard = filters.card ?? "";
  const hasActiveFilters = Boolean(
    filters.q || filters.status || filters.category || filters.priority || filters.card
  );
  const advancedFilterCount = [filters.priority].filter(Boolean).length;

  const updateFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!patch.page) params.delete("page");
      startTransition(() => {
        router.push(`/dashboard/chamados?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setCategory("");
    setPriorityFilter("");
    setMoreFiltersOpen(false);
    startTransition(() => router.push("/dashboard/chamados"));
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = q.trim();
      if ((filters.q ?? "") === next) return;
      updateFilters({
        q: next || undefined,
        status: status || undefined,
        category: category || undefined,
        priority: priorityFilter || undefined,
        card: activeCard || undefined,
      });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    const result = await getTicketDetail(id);
    setDetail(result);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) loadDetail(id);
  }, [searchParams, loadDetail]);

  async function handleCreate() {
    const result = await createTicket({
      subject,
      description,
      priority: priority as "BAIXA" | "MEDIA" | "ALTA",
      category: newCategory || undefined,
      scope: "SAAS",
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Chamado enviado ao suporte Unimetra");
    setOpen(false);
    setSubject("");
    setDescription("");
    setNewCategory("");
    setPriority("MEDIA");
    startTransition(() => router.refresh());
  }

  async function handleReply() {
    if (!detailId || !reply.trim()) return;
    const result = await addTicketComment(detailId, reply);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setReply("");
    await loadDetail(detailId);
    startTransition(() => router.refresh());
  }

  const statCards = ticketStatCardsForEmpresa().map((card) => ({
    ...card,
    value: statCounts[card.key] ?? 0,
    icon: STAT_ICONS[card.key as keyof typeof STAT_ICONS] ?? CircleDot,
    tone: card.key === "resolvidos" ? ("primary" as const) : ("primary" as const),
    hint:
      card.key === "abertos"
        ? "Aguardando resposta"
        : card.key === "em_atendimento"
          ? "Em andamento"
          : "Finalizados",
  }));

  return (
    <PageModule className="chamados-empresa">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Chamados</h1>
          <p className="colaboradores-empresa-subtitle">
            Acompanhe solicitações e atendimentos do suporte.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Button variant="brand" size="sm" className="rounded-lg" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Abrir chamado
          </Button>
        </div>
      </header>

      <div className="colaboradores-empresa-stats chamados-empresa-stats">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isActive = activeCard === card.key;
          return (
            <button
              key={card.key}
              type="button"
              className={cn(
                "colaboradores-empresa-stat colaboradores-empresa-stat--clickable",
                isActive && "colaboradores-empresa-stat--active"
              )}
              onClick={() =>
                updateFilters({
                  card: isActive ? undefined : card.key,
                  status: undefined,
                  q: q.trim() || undefined,
                  category: category || undefined,
                  priority: priorityFilter || undefined,
                })
              }
            >
              <span className="colaboradores-empresa-stat-icon colaboradores-empresa-stat-icon--primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="colaboradores-empresa-stat-body">
                <span className="colaboradores-empresa-stat-value">{card.value}</span>
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
              placeholder="Buscar por assunto ou descrição"
              aria-label="Buscar chamados"
              className="colaboradores-empresa-search-input"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              const value = e.target.value;
              setStatus(value);
              updateFilters({
                status: value || undefined,
                card: undefined,
                q: q.trim() || undefined,
                category: category || undefined,
                priority: priorityFilter || undefined,
              });
            }}
            aria-label="Filtrar por status"
            className="colaboradores-empresa-select"
          >
            <option value="">Status</option>
            {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => {
              const value = e.target.value;
              setCategory(value);
              updateFilters({
                category: value || undefined,
                q: q.trim() || undefined,
                status: status || undefined,
                priority: priorityFilter || undefined,
                card: activeCard || undefined,
              });
            }}
            aria-label="Filtrar por categoria"
            className="colaboradores-empresa-select"
          >
            <option value="">Categoria</option>
            {EMPRESA_TICKET_CATEGORIES.map((c) => (
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
            onClick={() => setMoreFiltersOpen((v) => !v)}
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
              Limpar
            </Button>
          )}
        </div>

        {moreFiltersOpen && (
          <div className="colaboradores-empresa-filters-advanced">
            <select
              value={priorityFilter}
              onChange={(e) => {
                const value = e.target.value;
                setPriorityFilter(value);
                updateFilters({
                  priority: value || undefined,
                  q: q.trim() || undefined,
                  status: status || undefined,
                  category: category || undefined,
                  card: activeCard || undefined,
                });
              }}
              aria-label="Filtrar por prioridade"
              className="colaboradores-empresa-select"
            >
              <option value="">Prioridade</option>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>
        )}
      </div>

      <div className="colaboradores-empresa-table-wrap relative">
        {pending && <LoadingState overlay label="Atualizando..." />}

        {items.length === 0 ? (
          <EmptyState
            compact
            className="colaboradores-empresa-empty"
            title="Nenhum chamado aberto"
            description="Quando precisar de ajuda, abra uma solicitação para nossa equipe."
          />
        ) : (
          <>
            <div className="colaboradores-empresa-result-bar">
              <p className="colaboradores-empresa-result-count">
                {total === 1 ? "1 chamado encontrado" : `${total} chamados encontrados`}
              </p>
            </div>
            <div className="colaboradores-empresa-table-scroll chamados-empresa-table-scroll">
              <table className="colaboradores-empresa-table">
                <thead>
                  <tr>
                    <th>Assunto</th>
                    <th>Categoria</th>
                    <th>Data de abertura</th>
                    <th>Última atualização</th>
                    <th>Status</th>
                    <th className="colaboradores-empresa-th-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="colaboradores-empresa-row">
                      <td>
                        <div className="colaboradores-empresa-name">{item.subject}</div>
                      </td>
                      <td>
                        <span className="colaboradores-empresa-role">
                          {item.category ?? "—"}
                        </span>
                      </td>
                      <td>
                        {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td>
                        {format(new Date(item.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="colaboradores-empresa-td-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => loadDetail(item.id)}
                        >
                          Ver detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {total > pageSize && (
        <div className="colaboradores-empresa-pagination">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={page <= 1 || pending}
            onClick={() => updateFilters({ page: String(page - 1) })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="colaboradores-empresa-pagination-label">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={page >= totalPages || pending}
            onClick={() => updateFilters({ page: String(page + 1) })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo chamado</DialogTitle>
            <DialogDescription>
              Descreva o problema. O time Unimetra responderá pelo portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Assunto *"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Select value={newCategory} onValueChange={(v) => setNewCategory(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {EMPRESA_TICKET_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Descreva o problema ou dúvida *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button
              variant="brand"
              className="rounded-lg"
              onClick={handleCreate}
              disabled={pending || !subject.trim() || !description.trim()}
            >
              Enviar chamado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-green)]" />
            </div>
          ) : detail?.success ? (
            <>
              <SheetHeader>
                <SheetTitle>{detail.ticket.subject}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={detail.ticket.status} />
                  {detail.ticket.category && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {detail.ticket.category}
                    </span>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
                  {detail.ticket.description}
                </div>
                <p className="text-xs text-slate-400">
                  Aberto por {detail.ticket.createdBy.name} em{" "}
                  {format(new Date(detail.ticket.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </p>

                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <h4 className="text-sm font-semibold text-slate-900">Mensagens</h4>
                  {detail.ticket.comments.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhuma resposta ainda.</p>
                  ) : (
                    detail.ticket.comments.map(
                      (c: { id: string; content: string; createdByName: string }) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-slate-100 bg-white p-3 text-sm"
                        >
                          <p className="text-xs font-medium text-slate-500">{c.createdByName}</p>
                          <p className="mt-1 text-slate-700">{c.content}</p>
                        </div>
                      )
                    )
                  )}
                  <Textarea
                    placeholder="Escreva sua mensagem..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                  />
                  <Button
                    size="sm"
                    variant="brand"
                    className="rounded-lg"
                    onClick={handleReply}
                    disabled={!reply.trim()}
                  >
                    Enviar mensagem
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-500">
              {detail && !detail.success ? detail.error : "Erro ao carregar."}
            </p>
          )}
        </SheetContent>
      </Sheet>
    </PageModule>
  );
}
