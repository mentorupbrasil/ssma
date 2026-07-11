"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Loader2,
  MessageSquare,
  Search,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageModule } from "@/components/dashboard/PageModule";
import { FilterMetricGrid } from "@/components/dashboard/FilterMetricGrid";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { FilterBar } from "@/components/dashboard/FilterBar";
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
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createTicket,
  getTicketDetail,
  addTicketComment,
} from "@/actions/tickets";
import {
  TICKET_STAT_CARDS,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_CATEGORIES,
  getTicketSlaStatus,
} from "@/lib/tickets";
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
  createdByName: string;
  assignedTo: { id: string; name: string } | null;
  companyName: string | null;
  commentCount: number;
};

type ChamadosClientProps = {
  items: TicketItem[];
  total: number;
  statCounts: Record<string, number>;
  users: { id: string; name: string }[];
  filters: { q?: string; status?: string; priority?: string; card?: string };
  saasMode?: boolean;
  isEmpresaPortal?: boolean;
};

const EMPRESA_TICKET_CATEGORIES = [
  "Suporte técnico",
  "Acesso e permissões",
  "Portal empresarial",
  "Importação de colaboradores",
  "Documentos",
  "Outro",
] as const;

export function ChamadosClient({
  items,
  total,
  statCounts,
  users,
  filters,
  saasMode = false,
  isEmpresaPortal = false,
}: ChamadosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState(filters.q ?? "");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getTicketDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");

  const basePath = saasMode ? "/super-admin/chamados" : "/dashboard/chamados";
  const statCards = isEmpresaPortal ? ticketStatCardsForEmpresa() : TICKET_STAT_CARDS;
  const categories = isEmpresaPortal ? EMPRESA_TICKET_CATEGORIES : TICKET_CATEGORIES;

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  const handleSearch = () => setFilter("q", q);

  const clearFilters = () => {
    setQ("");
    startTransition(() => router.push(basePath));
  };

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
      category: category || undefined,
      scope: saasMode || isEmpresaPortal ? "SAAS" : "CLINIC",
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEmpresaPortal ? "Chamado enviado ao suporte Unimetra" : "Chamado aberto");
    setOpen(false);
    setSubject("");
    setDescription("");
    setCategory("");
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

  return (
    <PageModule>
      <PageHeader
        title={saasMode ? "Chamados SaaS" : "Chamados"}
        description={
          isEmpresaPortal
            ? "Suporte da plataforma Unimetra — dúvidas técnicas, acesso e portal empresarial"
            : saasMode
              ? "Suporte entre clínicas e plataforma"
              : "Suporte interno e solicitações de empresas"
        }
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button variant="brand">
                  <Plus className="mr-2 h-4 w-4" />
                  Abrir chamado
                </Button>
              }
            />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo chamado</DialogTitle>
                <DialogDescription>
                  {isEmpresaPortal
                    ? "Descreva o problema. O time Unimetra responderá pelo portal."
                    : "Registre uma solicitação de suporte."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Assunto *"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isEmpresaPortal && (
                  <Select value={priority} onValueChange={(v) => setPriority(v ?? "MEDIA")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TICKET_PRIORITY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
                  onClick={handleCreate}
                  disabled={pending || !subject.trim() || !description.trim()}
                >
                  Enviar chamado
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <FilterMetricGrid
        items={statCards.map((card) => ({
          key: card.key,
          metaKey: `ticket:${card.key}`,
          label: card.label,
          value: statCounts[card.key] ?? 0,
          active: filters.card === card.key,
          onClick: () => setFilter("card", filters.card === card.key ? "" : card.key),
        }))}
      />

      <FilterBar onSearch={handleSearch} onClear={clearFilters} isPending={pending}>
        <div className="referral-filter-search sm:col-span-2">
          <Search className="referral-filter-search-icon h-4 w-4" />
          <Input
            placeholder="Buscar por assunto ou descrição"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        {!isEmpresaPortal && (
          <select
            className="referral-filter-select"
            value={filters.priority ?? "ALL"}
            onChange={(e) => setFilter("priority", e.target.value)}
          >
            <option value="ALL">Prioridade</option>
            {Object.entries(TICKET_PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        )}
        <select
          className="referral-filter-select"
          value={filters.status ?? "ALL"}
          onChange={(e) => setFilter("status", e.target.value)}
        >
          <option value="ALL">Status</option>
          {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          className="mt-8 bg-white"
          title="Nenhum chamado"
          description={
            isEmpresaPortal
              ? "Abra um chamado quando precisar de ajuda com o portal ou acesso à plataforma."
              : "Abra um chamado quando precisar de suporte ou acompanhamento."
          }
          action={{ label: "Abrir chamado", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="relative mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          {pending && <LoadingState overlay label="Atualizando chamados..." />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                {!isEmpresaPortal && <TableHead>Prioridade</TableHead>}
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead className="hidden lg:table-cell">Mensagens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const sla = getTicketSlaStatus({
                  priority: item.priority as "BAIXA" | "MEDIA" | "ALTA",
                  status: item.status as keyof typeof TICKET_STATUS_LABELS,
                  createdAt: new Date(item.createdAt),
                });
                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-slate-50/80"
                    onClick={() => loadDetail(item.id)}
                  >
                    <TableCell>
                      <p className="font-medium text-slate-900">{item.subject}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    {!isEmpresaPortal && (
                      <TableCell className="text-sm text-slate-600">
                        {TICKET_PRIORITY_LABELS[item.priority as keyof typeof TICKET_PRIORITY_LABELS]}
                        <span
                          className={cn(
                            "ml-2 text-xs font-medium",
                            sla === "breached" && "text-red-600",
                            sla === "warning" && "text-amber-600",
                            sla === "ok" && "text-emerald-600",
                            sla === "closed" && "text-slate-400"
                          )}
                        >
                          {sla === "breached"
                            ? "SLA vencido"
                            : sla === "warning"
                              ? "SLA próximo"
                              : sla === "closed"
                                ? ""
                                : "No prazo"}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="hidden md:table-cell text-sm text-slate-600">
                      {item.category ?? "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                      {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {item.commentCount > 0 ? (
                        <span className="inline-flex items-center text-xs text-slate-500">
                          <MessageSquare className="mr-1 h-3.5 w-3.5" />
                          {item.commentCount}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">
              {items.length} de {total} chamado{total !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#16A085]" />
            </div>
          ) : detail?.success ? (
            <>
              <SheetHeader>
                <SheetTitle>{detail.ticket.subject}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={detail.ticket.status} />
                  {!isEmpresaPortal && <StatusBadge status={detail.ticket.priority} />}
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
                  {format(new Date(detail.ticket.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>

                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <h4 className="text-sm font-semibold text-slate-900">Mensagens</h4>
                  {detail.ticket.comments.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhuma resposta ainda.</p>
                  ) : (
                    detail.ticket.comments.map(
                      (c: { id: string; content: string; createdByName: string }) => (
                        <div key={c.id} className="rounded-xl border border-slate-100 bg-white p-3 text-sm">
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
                  <Button size="sm" variant="brand" onClick={handleReply} disabled={!reply.trim()}>
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
