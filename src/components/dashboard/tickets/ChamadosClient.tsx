"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Loader2, MessageSquare, ListTodo } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createTicket,
  updateTicketStatus,
  updateTicket,
  getTicketDetail,
  addTicketComment,
} from "@/actions/tickets";
import { convertTicketToTask } from "@/actions/tasks";
import {
  TICKET_STAT_CARDS,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_CATEGORIES,
  getTicketSlaStatus,
} from "@/lib/tickets";
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
};

export function ChamadosClient({
  items,
  total,
  statCounts,
  users,
  filters,
  saasMode = false,
}: ChamadosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [category, setCategory] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getTicketDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    router.push(`${saasMode ? "/super-admin/chamados" : "/dashboard/chamados"}?${params.toString()}`);
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
      scope: saasMode ? "SAAS" : "CLINIC",
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Chamado aberto");
    setOpen(false);
    setSubject("");
    setDescription("");
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
    <div className="referrals-module">
      <PageHeader
        title={saasMode ? "Chamados SaaS" : "Chamados"}
        description={saasMode ? "Suporte entre clínicas e plataforma" : "Suporte interno e solicitações de empresas"}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Abrir chamado</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Novo chamado</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Assunto *" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priority} onValueChange={(v) => setPriority(v ?? "MEDIA")}>
                  <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TICKET_PRIORITY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Descreva o problema *" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                <Button onClick={handleCreate} disabled={pending || !subject.trim() || !description.trim()}>Enviar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="referral-stat-grid referral-stat-grid-6 mb-6">
        {TICKET_STAT_CARDS.map((card) => (
          <button
            key={card.key}
            type="button"
            className={cn(
              "referral-stat-card text-left",
              filters.card === card.key && "referral-stat-card-active"
            )}
            onClick={() => setFilter("card", filters.card === card.key ? "" : card.key)}
          >
            <span className="referral-stat-count">{statCounts[card.key] ?? 0}</span>
            <span className="referral-stat-label">{card.label}</span>
          </button>
        ))}
      </div>

      <FilterBar className="mb-4">
        <Input
          placeholder="Buscar chamado..."
          defaultValue={filters.q}
          className="max-w-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") setFilter("q", (e.target as HTMLInputElement).value);
          }}
        />
        <Select value={filters.priority ?? "ALL"} onValueChange={(v) => setFilter("priority", v ?? "ALL")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            {Object.entries(TICKET_PRIORITY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState title="Nenhum chamado" description="Abra um chamado quando precisar de suporte ou acompanhamento." />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data</TableHead>
                <TableHead />
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
                  <TableRow key={item.id} className="cursor-pointer hover:bg-slate-50" onClick={() => loadDetail(item.id)}>
                    <TableCell>
                      <p className="font-medium">{item.subject}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                      {item.commentCount > 0 && (
                        <span className="mt-1 inline-flex items-center text-xs text-slate-400">
                          <MessageSquare className="mr-1 h-3 w-3" />{item.commentCount}
                        </span>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell>{TICKET_PRIORITY_LABELS[item.priority as keyof typeof TICKET_PRIORITY_LABELS]}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-xs font-medium",
                        sla === "breached" && "text-red-600",
                        sla === "warning" && "text-amber-600",
                        sla === "ok" && "text-emerald-600",
                        sla === "closed" && "text-slate-400"
                      )}>
                        {sla === "breached" ? "Vencido" : sla === "warning" ? "Próximo" : sla === "closed" ? "—" : "No prazo"}
                      </span>
                    </TableCell>
                    <TableCell>{item.assignedTo?.name ?? "—"}</TableCell>
                    <TableCell>{format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {item.status !== "FECHADO" && item.status !== "RESOLVIDO" && (
                        <Button size="sm" variant="outline" onClick={() => startTransition(async () => {
                          await updateTicketStatus(item.id, "RESOLVIDO");
                          router.refresh();
                        })}>Resolver</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="border-t px-4 py-2 text-xs text-slate-500">{items.length} de {total} chamados</p>
        </div>
      )}

      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detailLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : detail?.success ? (
            <>
              <SheetHeader>
                <SheetTitle>{detail.ticket.subject}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={detail.ticket.status} />
                  <StatusBadge status={detail.ticket.priority} />
                  {detail.ticket.category && <span className="text-xs text-slate-500">{detail.ticket.category}</span>}
                </div>
                <p className="text-sm text-slate-600">{detail.ticket.description}</p>
                <p className="text-xs text-slate-400">
                  Aberto por {detail.ticket.createdBy.name} em{" "}
                  {format(new Date(detail.ticket.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>

                <Select
                  value={detail.ticket.assignedTo?.id ?? ""}
                  onValueChange={(v) => startTransition(async () => {
                    if (!detailId) return;
                    await updateTicket({ id: detailId, assignedToUserId: v || null });
                    await loadDetail(detailId);
                    router.refresh();
                  })}
                >
                  <SelectTrigger><SelectValue placeholder="Atribuir responsável" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem responsável</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-3 border-t pt-4">
                  <h4 className="text-sm font-semibold">Mensagens</h4>
                  {detail.ticket.comments.map((c: { id: string; content: string; createdByName: string }) => (
                    <div key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                      <p className="text-xs font-medium text-slate-500">{c.createdByName}</p>
                      <p className="mt-1">{c.content}</p>
                    </div>
                  ))}
                  <Textarea placeholder="Responder..." value={reply} onChange={(e) => setReply(e.target.value)} rows={3} />
                  <Button size="sm" onClick={handleReply} disabled={!reply.trim()}>Enviar</Button>
                </div>

                <div className="flex flex-wrap gap-2 border-t pt-4">
                  {detail.ticket.status !== "RESOLVIDO" && detail.ticket.status !== "FECHADO" && (
                    <>
                      <Button size="sm" variant="brand" onClick={() => startTransition(async () => {
                        if (!detailId) return;
                        await updateTicketStatus(detailId, "RESOLVIDO");
                        await loadDetail(detailId);
                        router.refresh();
                      })}>Marcar resolvido</Button>
                      <Button size="sm" variant="outline" onClick={() => startTransition(async () => {
                        if (!detailId) return;
                        const r = await convertTicketToTask(detailId);
                        if (r.success) toast.success("Tarefa criada a partir do chamado");
                        else toast.error(r.error);
                      })}>
                        <ListTodo className="mr-1 h-4 w-4" /> Virar tarefa
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-500">{detail && !detail.success ? detail.error : "Erro ao carregar."}</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
