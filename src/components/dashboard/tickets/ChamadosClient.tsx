"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  LifeBuoy,
  ListTodo,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import {
  SystemActionMenu,
  type SystemActionItem,
} from "@/components/dashboard/SystemActionMenu";
import {
  SystemModalField,
  SystemModalShell,
} from "@/components/dashboard/SystemModalShell";
import { LoadingState } from "@/components/ui/loading-state";
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
  addTicketComment,
  assignTicket,
  createTaskFromTicket,
  createTicket,
  getTicketDetail,
  updateTicket,
  updateTicketStatus,
} from "@/actions/tickets";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/tickets";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TicketItem = {
  id: string;
  protocol: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  assignedTo: { id: string; name: string } | null;
  companyId: string | null;
  companyName: string | null;
  commentCount: number;
};

type CompanyOption = { id: string; name: string };

type ChamadosClientProps = {
  items: TicketItem[];
  total: number;
  page: number;
  pageSize: number;
  users: { id: string; name: string }[];
  companies: CompanyOption[];
  filters: {
    q?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    companyId?: string;
  };
  saasMode?: boolean;
};

export function ChamadosClient({
  items,
  total,
  page,
  pageSize,
  users,
  companies,
  filters,
  saasMode = false,
}: ChamadosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [active, setActive] = useState<TicketItem | null>(null);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [category, setCategory] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [q, setQ] = useState(filters.q ?? "");
  const [assignUserId, setAssignUserId] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIA");
  const [editStatus, setEditStatus] = useState("ABERTO");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getTicketDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const basePath = saasMode ? "/super-admin/chamados" : "/dashboard/chamados";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    startTransition(() => router.push(`${basePath}?${params.toString()}`));
  };

  const goPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    startTransition(() => router.push(`${basePath}?${params.toString()}`));
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
    if (id) void loadDetail(id);
  }, [searchParams, loadDetail]);

  async function handleCreate() {
    const result = await createTicket({
      subject,
      description,
      priority: priority as "BAIXA" | "MEDIA" | "ALTA" | "URGENTE",
      category: category || undefined,
      companyId: companyId || undefined,
      scope: saasMode ? "SAAS" : "CLINIC",
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Chamado aberto.");
    setCreateOpen(false);
    setSubject("");
    setDescription("");
    setCategory("");
    setCompanyId("");
    setPriority("MEDIA");
    startTransition(() => router.refresh());
  }

  async function handleReply(isInternal = false) {
    if (!detailId) return;
    const content = isInternal ? internalNote : reply;
    if (!content.trim() && !attachmentUrl.trim()) return;
    const result = await addTicketComment(detailId, content, {
      isInternal,
      attachmentUrl: attachmentUrl || undefined,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (isInternal) setInternalNote("");
    else setReply("");
    setAttachmentUrl("");
    await loadDetail(detailId);
    startTransition(() => router.refresh());
  }

  async function handleAssign() {
    if (!active) return;
    const result = await assignTicket(active.id, assignUserId || null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Responsável atualizado.");
    setAssignOpen(false);
    if (detailId === active.id) await loadDetail(active.id);
    startTransition(() => router.refresh());
  }

  async function handlePriority() {
    if (!active) return;
    const result = await updateTicket({
      id: active.id,
      priority: editPriority as "BAIXA" | "MEDIA" | "ALTA" | "URGENTE",
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Prioridade atualizada.");
    setPriorityOpen(false);
    if (detailId === active.id) await loadDetail(active.id);
    startTransition(() => router.refresh());
  }

  async function handleStatus() {
    if (!active) return;
    const result = await updateTicketStatus(
      active.id,
      editStatus as "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_CLIENTE" | "RESOLVIDO" | "FECHADO"
    );
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Status atualizado.");
    setStatusOpen(false);
    if (detailId === active.id) await loadDetail(active.id);
    startTransition(() => router.refresh());
  }

  function rowActions(item: TicketItem): SystemActionItem[] {
    const closed = item.status === "FECHADO";
    return [
      {
        label: "Abrir chamado",
        hint: "Ver detalhes e mensagens",
        icon: Eye,
        iconTone: "view",
        onClick: () => void loadDetail(item.id),
      },
      {
        label: "Atribuir responsável",
        hint: "Definir quem atende",
        icon: UserRound,
        iconTone: "schedule",
        onClick: () => {
          setActive(item);
          setAssignUserId(item.assignedTo?.id ?? "");
          setAssignOpen(true);
        },
        disabled: closed || pending,
      },
      {
        label: "Alterar prioridade",
        hint: "Baixa, Normal, Alta ou Urgente",
        icon: Flag,
        iconTone: "progress",
        onClick: () => {
          setActive(item);
          setEditPriority(item.priority);
          setPriorityOpen(true);
        },
        disabled: closed || pending,
      },
      {
        label: "Alterar status",
        hint: "Atualizar andamento",
        icon: CheckCircle2,
        iconTone: "docs",
        onClick: () => {
          setActive(item);
          setEditStatus(item.status);
          setStatusOpen(true);
        },
        disabled: closed || pending,
      },
      {
        label: "Criar tarefa interna",
        hint: "Gera tarefa vinculada ao chamado",
        icon: ListTodo,
        iconTone: "quote",
        onClick: () =>
          startTransition(async () => {
            const result = await createTaskFromTicket(item.id);
            if (!result.success) {
              toast.error(result.error);
              return;
            }
            toast.success("Tarefa interna criada.");
            router.refresh();
          }),
        disabled: pending,
      },
      {
        label: "Fechar chamado",
        hint: "Encerrar solicitação",
        icon: Ban,
        iconTone: "cancel",
        onClick: () =>
          startTransition(async () => {
            await updateTicketStatus(item.id, "FECHADO");
            toast.success("Chamado fechado.");
            if (detailId === item.id) await loadDetail(item.id);
            router.refresh();
          }),
        disabled: closed || pending,
      },
    ];
  }

  const hasFilters = Boolean(
    filters.q ||
      filters.status ||
      filters.priority ||
      filters.category ||
      filters.assignedTo ||
      filters.companyId
  );

  return (
    <PageModule className="chamados-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">
            {saasMode ? "Chamados SaaS" : "Chamados"}
          </h1>
          <p className="colaboradores-empresa-subtitle">
            {saasMode
              ? "Solicitações de suporte entre clínicas e a plataforma."
              : "Central de solicitações de suporte das empresas e da equipe interna."}
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Button variant="brand" size="sm" className="rounded-lg" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Abrir chamado
          </Button>
        </div>
      </header>

      <div className="tabela-precos-filters chamados-filters">
        <div className="tabela-precos-search">
          <Search className="tabela-precos-search-icon" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setFilter("q", q.trim());
            }}
            placeholder="Buscar protocolo, assunto ou descrição"
            className="tabela-precos-search-input"
          />
        </div>
        <select
          className="tabela-precos-select"
          value={filters.companyId ?? ""}
          onChange={(e) => setFilter("companyId", e.target.value)}
          aria-label="Empresa"
        >
          <option value="">Empresa</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="tabela-precos-select"
          value={filters.category ?? ""}
          onChange={(e) => setFilter("category", e.target.value)}
          aria-label="Categoria"
        >
          <option value="">Categoria</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="tabela-precos-select"
          value={filters.priority ?? ""}
          onChange={(e) => setFilter("priority", e.target.value)}
          aria-label="Prioridade"
        >
          <option value="">Prioridade</option>
          {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="tabela-precos-select"
          value={filters.status ?? ""}
          onChange={(e) => setFilter("status", e.target.value)}
          aria-label="Status"
        >
          <option value="">Status</option>
          {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="tabela-precos-select"
          value={filters.assignedTo ?? ""}
          onChange={(e) => setFilter("assignedTo", e.target.value)}
          aria-label="Responsável"
        >
          <option value="">Responsável</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              startTransition(() => router.push(basePath));
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          compact
          title="Nenhum chamado encontrado"
          description="As solicitações enviadas pelas empresas ou pela equipe aparecerão aqui."
          action={{ label: "Abrir chamado", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="colaboradores-empresa-table-wrap relative">
          {pending && <LoadingState overlay label="Atualizando…" />}
          <div className="colaboradores-empresa-table-scroll">
            <Table className="colaboradores-empresa-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Empresa/Solicitante</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Última atualização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => void loadDetail(item.id)}
                  >
                    <TableCell className="font-mono text-xs font-semibold">
                      {item.protocol}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-slate-900">{item.subject}</span>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{item.companyName ?? "Interno"}</p>
                      <p className="text-xs text-slate-500">{item.createdByName}</p>
                    </TableCell>
                    <TableCell>{item.category ?? "—"}</TableCell>
                    <TableCell>
                      {TICKET_PRIORITY_LABELS[item.priority as keyof typeof TICKET_PRIORITY_LABELS] ??
                        item.priority}
                    </TableCell>
                    <TableCell>{item.assignedTo?.name ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-600">
                      {format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={item.status}
                        label={
                          TICKET_STATUS_LABELS[item.status as keyof typeof TICKET_STATUS_LABELS] ??
                          item.status
                        }
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <SystemActionMenu items={rowActions(item)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">
              {items.length} de {total} chamado{total !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || pending}
                onClick={() => goPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="self-center text-xs text-slate-500">
                {page}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || pending}
                onClick={() => goPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <SystemModalShell
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Abrir chamado"
        description="Registre uma solicitação de suporte."
        badges={[
          { label: "Chamados", variant: "category" },
          { label: "Novo", variant: "status" },
        ]}
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleCreate()}
              disabled={pending || !subject.trim() || !description.trim()}
            >
              Abrir chamado
            </Button>
          </div>
        }
      >
        <SystemModalField label="Assunto" required wide>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto" />
        </SystemModalField>
        <SystemModalField label="Empresa" wide>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">Interno / sem empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </SystemModalField>
        <SystemModalField label="Categoria" wide>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Selecione</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </SystemModalField>
        <SystemModalField label="Prioridade">
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </SystemModalField>
        <SystemModalField label="Descrição" required wide>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a solicitação"
            rows={5}
          />
        </SystemModalField>
      </SystemModalShell>

      <SystemModalShell
        open={assignOpen}
        onOpenChange={setAssignOpen}
        title="Atribuir responsável"
        description={active?.subject}
        badges={[{ label: "Responsável", variant: "status" }]}
        className="max-w-md"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setAssignOpen(false)}>
              Cancelar
            </Button>
            <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleAssign()}>
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Responsável" wide>
          <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}>
            <option value="">Sem responsável</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </SystemModalField>
      </SystemModalShell>

      <SystemModalShell
        open={priorityOpen}
        onOpenChange={setPriorityOpen}
        title="Alterar prioridade"
        description={active?.subject}
        badges={[{ label: "Prioridade", variant: "status" }]}
        className="max-w-md"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setPriorityOpen(false)}>
              Cancelar
            </Button>
            <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handlePriority()}>
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Prioridade" wide>
          <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
            {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </SystemModalField>
      </SystemModalShell>

      <SystemModalShell
        open={statusOpen}
        onOpenChange={setStatusOpen}
        title="Alterar status"
        description={active?.subject}
        badges={[{ label: "Status", variant: "status" }]}
        className="max-w-md"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setStatusOpen(false)}>
              Cancelar
            </Button>
            <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleStatus()}>
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Status" wide>
          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
            {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </SystemModalField>
      </SystemModalShell>

      <DetailDrawer
        open={!!detailId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null);
            setDetail(null);
          }
        }}
        title={
          detail?.success
            ? `${detail.ticket.protocol} · ${detail.ticket.subject}`
            : "Chamado"
        }
        description={
          detail?.success
            ? `${detail.ticket.companyName ?? "Interno"} · ${detail.ticket.createdBy.name}`
            : undefined
        }
        size="xl"
        footer={
          detail?.success && detail.ticket.status !== "FECHADO" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  startTransition(async () => {
                    const result = await createTaskFromTicket(detail.ticket.id);
                    if (!result.success) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success("Tarefa interna criada.");
                  })
                }
              >
                Criar tarefa interna
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={() =>
                  startTransition(async () => {
                    await updateTicketStatus(detail.ticket.id, "FECHADO");
                    toast.success("Chamado fechado.");
                    await loadDetail(detail.ticket.id);
                    router.refresh();
                  })
                }
              >
                Fechar chamado
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailLoading ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : detail?.success ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                status={detail.ticket.status}
                label={
                  TICKET_STATUS_LABELS[
                    detail.ticket.status as keyof typeof TICKET_STATUS_LABELS
                  ]
                }
              />
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {TICKET_PRIORITY_LABELS[
                  detail.ticket.priority as keyof typeof TICKET_PRIORITY_LABELS
                ]}
              </span>
              {detail.ticket.category && (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {detail.ticket.category}
                </span>
              )}
            </div>

            <dl className="space-y-2 text-sm">
              <DetailRow label="Empresa" value={detail.ticket.companyName ?? "Interno"} />
              <DetailRow label="Solicitante" value={detail.ticket.createdBy.name} />
              <DetailRow
                label="Responsável"
                value={detail.ticket.assignedTo?.name ?? "—"}
              />
              <DetailRow
                label="Abertura"
                value={format(new Date(detail.ticket.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              />
              <DetailRow
                label="Atualização"
                value={format(new Date(detail.ticket.updatedAt), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              />
            </dl>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-700">
              {detail.ticket.description}
            </div>

            {detail.ticket.attachments.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-900">Anexos</h4>
                <ul className="space-y-1 text-sm">
                  {detail.ticket.attachments.map((a) => (
                    <li key={a.id}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--brand-green)] underline"
                      >
                        {a.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-900">Histórico de mensagens</h4>
              {detail.ticket.comments.filter((c) => !c.isInternal).length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma mensagem ainda.</p>
              ) : (
                detail.ticket.comments
                  .filter((c) => !c.isInternal)
                  .map((c) => (
                    <div key={c.id} className="rounded-xl border border-slate-100 bg-white p-3 text-sm">
                      <div className="flex justify-between gap-2 text-xs text-slate-500">
                        <span className="font-medium">{c.createdByName}</span>
                        <span>
                          {format(new Date(c.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-700">{c.content}</p>
                      {c.attachmentUrl && (
                        <a
                          href={c.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-[var(--brand-green)] underline"
                        >
                          Anexo
                        </a>
                      )}
                    </div>
                  ))
              )}

              <Textarea
                placeholder="Responder ao solicitante…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
              />
              <Input
                placeholder="Link de anexo (opcional)"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
              />
              <Button
                size="sm"
                variant="brand"
                onClick={() => void handleReply(false)}
                disabled={!reply.trim() && !attachmentUrl.trim()}
              >
                Enviar resposta
              </Button>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-900">Observações internas</h4>
              <p className="text-xs text-slate-500">
                Visíveis apenas para a equipe Unimetra — não aparecem no Portal RH.
              </p>
              {detail.ticket.comments.filter((c) => c.isInternal).map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-sm"
                >
                  <div className="flex justify-between gap-2 text-xs text-amber-800/80">
                    <span className="font-medium">{c.createdByName}</span>
                    <span>
                      {format(new Date(c.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-700">{c.content}</p>
                </div>
              ))}
              <Textarea
                placeholder="Nota interna…"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={2}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleReply(true)}
                disabled={!internalNote.trim()}
              >
                Salvar observação interna
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-500">
            {detail && !detail.success ? detail.error : "Erro ao carregar."}
          </p>
        )}
      </DetailDrawer>
    </PageModule>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-[var(--dash-text-muted)]">{label}</dt>
      <dd className={cn("max-w-[65%] text-right font-medium text-slate-800")}>{value}</dd>
    </div>
  );
}
