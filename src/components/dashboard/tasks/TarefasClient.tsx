"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Eye,
  LayoutGrid,
  List,
  ListTodo,
  Pencil,
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
import { Button, buttonVariants } from "@/components/ui/button";
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
import { createTask, updateTask, updateTaskStatus } from "@/actions/tasks";
import {
  KANBAN_COLUMNS,
  TASK_ORIGIN_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  isTaskOverdue,
  taskOriginLabel,
} from "@/lib/tasks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: { id: string; name: string } | null;
  createdByName: string;
  companyId: string | null;
  companyName: string | null;
  origin: string | null;
  linkUrl: string | null;
  systemGenerated: boolean;
  createdAt: string;
};

type TarefasClientProps = {
  items: TaskItem[];
  total: number;
  users: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  filters: {
    q?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    due?: string;
    origin?: string;
  };
};

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function TarefasClient({
  items,
  total,
  users,
  companies,
  filters,
}: TarefasClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"list" | "board">("list");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [selected, setSelected] = useState<TaskItem | null>(null);
  const [active, setActive] = useState<TaskItem | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [origin, setOrigin] = useState("MANUAL");
  const [dueDate, setDueDate] = useState("");
  const [searchDraft, setSearchDraft] = useState(filters.q ?? "");

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/dashboard/tarefas?${params.toString()}`);
  };

  const hasFilters = Boolean(
    filters.q || filters.status || filters.priority || filters.assignedTo || filters.due || filters.origin
  );

  const boardColumns = useMemo(
    () =>
      KANBAN_COLUMNS.map((status) => ({
        status,
        label: TASK_STATUS_LABELS[status],
        tasks: items.filter((t) => t.status === status),
      })),
    [items]
  );

  function resetForm(item?: TaskItem) {
    setTitle(item?.title ?? "");
    setDescription(item?.description ?? "");
    setPriority(item?.priority ?? "MEDIA");
    setAssignedToUserId(item?.assignedTo?.id ?? "");
    setCompanyId(item?.companyId ?? "");
    setOrigin(item?.origin ?? "MANUAL");
    setDueDate(toDateInput(item?.dueDate));
  }

  function openCreate() {
    resetForm();
    setCreateOpen(true);
  }

  function openEdit(item: TaskItem) {
    setActive(item);
    resetForm(item);
    setEditOpen(true);
  }

  function openReassign(item: TaskItem) {
    setActive(item);
    setAssignedToUserId(item.assignedTo?.id ?? "");
    setReassignOpen(true);
  }

  function openDue(item: TaskItem) {
    setActive(item);
    setDueDate(toDateInput(item.dueDate));
    setDueOpen(true);
  }

  async function handleCreate() {
    const result = await createTask({
      title,
      description,
      priority: priority as "BAIXA" | "MEDIA" | "ALTA" | "URGENTE",
      assignedToUserId: assignedToUserId || undefined,
      companyId: companyId || undefined,
      origin: companyId && origin === "MANUAL" ? "EMPRESA" : origin,
      dueDate: dueDate || undefined,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Tarefa criada.");
    setCreateOpen(false);
    startTransition(() => router.refresh());
  }

  async function handleEdit() {
    if (!active) return;
    const result = await updateTask({
      id: active.id,
      title,
      description,
      priority: priority as "BAIXA" | "MEDIA" | "ALTA" | "URGENTE",
      assignedToUserId: assignedToUserId || null,
      companyId: companyId || null,
      origin,
      dueDate: dueDate || null,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Tarefa atualizada.");
    setEditOpen(false);
    setActive(null);
    startTransition(() => router.refresh());
  }

  async function handleReassign() {
    if (!active) return;
    const result = await updateTask({
      id: active.id,
      assignedToUserId: assignedToUserId || null,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Responsável atualizado.");
    setReassignOpen(false);
    setActive(null);
    startTransition(() => router.refresh());
  }

  async function handleDueChange() {
    if (!active) return;
    const result = await updateTask({
      id: active.id,
      dueDate: dueDate || null,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Prazo atualizado.");
    setDueOpen(false);
    setActive(null);
    startTransition(() => router.refresh());
  }

  function rowActions(item: TaskItem): SystemActionItem[] {
    const closed = item.status === "CONCLUIDA" || item.status === "CANCELADA";
    return [
      {
        label: "Abrir",
        hint: "Ver detalhes da tarefa",
        icon: Eye,
        iconTone: "view",
        onClick: () => setSelected(item),
      },
      {
        label: "Editar",
        hint: "Alterar título, prioridade e vínculo",
        icon: Pencil,
        iconTone: "docs",
        onClick: () => openEdit(item),
        disabled: closed || pending,
      },
      {
        label: "Marcar como concluída",
        hint: "Concluir esta pendência",
        icon: CheckCircle2,
        iconTone: "done",
        onClick: () =>
          startTransition(async () => {
            await updateTaskStatus(item.id, "CONCLUIDA");
            toast.success("Tarefa concluída.");
            router.refresh();
          }),
        disabled: closed || pending,
      },
      {
        label: "Reatribuir",
        hint: "Trocar responsável",
        icon: UserRound,
        iconTone: "schedule",
        onClick: () => openReassign(item),
        disabled: closed || pending,
      },
      {
        label: "Alterar prazo",
        hint: "Definir nova data",
        icon: CalendarClock,
        iconTone: "progress",
        onClick: () => openDue(item),
        disabled: closed || pending,
      },
      {
        label: "Cancelar",
        hint: "Cancelar esta tarefa",
        icon: Ban,
        iconTone: "cancel",
        onClick: () =>
          startTransition(async () => {
            await updateTaskStatus(item.id, "CANCELADA");
            toast.success("Tarefa cancelada.");
            if (selected?.id === item.id) setSelected(null);
            router.refresh();
          }),
        disabled: closed || pending,
      },
    ];
  }

  return (
    <PageModule className="tarefas-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Tarefas</h1>
          <p className="colaboradores-empresa-subtitle">
            Acompanhe pendências, responsáveis e prazos da operação.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <div className="tarefas-view-toggle" role="group" aria-label="Visualização">
            <button
              type="button"
              className={cn("tarefas-view-btn", view === "list" && "tarefas-view-btn--active")}
              onClick={() => setView("list")}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              type="button"
              className={cn("tarefas-view-btn", view === "board" && "tarefas-view-btn--active")}
              onClick={() => setView("board")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Quadro
            </button>
          </div>
          <Button variant="brand" size="sm" className="rounded-lg" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova tarefa
          </Button>
        </div>
      </header>

      <div className="tabela-precos-filters tarefas-filters">
        <div className="tabela-precos-search">
          <Search className="tabela-precos-search-icon" aria-hidden />
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setFilter("q", searchDraft.trim());
            }}
            placeholder="Buscar tarefa"
            className="tabela-precos-search-input"
          />
        </div>
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
        <select
          className="tabela-precos-select"
          value={filters.status ?? ""}
          onChange={(e) => setFilter("status", e.target.value)}
          aria-label="Status"
        >
          <option value="">Status</option>
          {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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
          {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="tabela-precos-select"
          value={filters.due ?? ""}
          onChange={(e) => setFilter("due", e.target.value)}
          aria-label="Prazo"
        >
          <option value="">Prazo</option>
          <option value="atrasadas">Atrasadas</option>
          <option value="hoje">Vencem hoje</option>
          <option value="semana">Próximos 7 dias</option>
        </select>
        <select
          className="tabela-precos-select"
          value={filters.origin ?? ""}
          onChange={(e) => setFilter("origin", e.target.value)}
          aria-label="Origem"
        >
          <option value="">Origem</option>
          {Object.entries(TASK_ORIGIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchDraft("");
              router.push("/dashboard/tarefas");
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          compact
          title="Nenhuma tarefa pendente"
          description="As tarefas criadas pela equipe ou geradas pelo sistema aparecerão aqui."
          action={{ label: "Nova tarefa", onClick: openCreate }}
        />
      ) : view === "list" ? (
        <div className="colaboradores-empresa-table-wrap">
          <div className="colaboradores-empresa-table-scroll">
            <Table className="colaboradores-empresa-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Vinculada a</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const overdue = isTaskOverdue(item.dueDate, item.status);
                  return (
                    <TableRow
                      key={item.id}
                      className={cn("cursor-pointer", overdue && "tarefas-row-overdue")}
                      onClick={() => setSelected(item)}
                    >
                      <TableCell>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        {item.systemGenerated && (
                          <span className="tarefas-system-tag">Gerada pelo sistema</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {taskOriginLabel(item.origin, item.companyName)}
                      </TableCell>
                      <TableCell>{item.assignedTo?.name ?? "—"}</TableCell>
                      <TableCell>
                        {TASK_PRIORITY_LABELS[item.priority as keyof typeof TASK_PRIORITY_LABELS] ??
                          item.priority}
                      </TableCell>
                      <TableCell>
                        <span className={cn(overdue && "tarefas-due-overdue")}>
                          {item.dueDate
                            ? format(new Date(item.dueDate), "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
                          {overdue ? " · Atrasada" : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={item.status}
                          label={
                            TASK_STATUS_LABELS[item.status as keyof typeof TASK_STATUS_LABELS] ??
                            item.status
                          }
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <SystemActionMenu items={rowActions(item)} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="border-t px-4 py-2 text-xs text-slate-500">
            {items.length} de {total} tarefas
          </p>
        </div>
      ) : (
        <div className="tarefas-board">
          {boardColumns.map((col) => (
            <section key={col.status} className="tarefas-board-col">
              <header className="tarefas-board-col-head">
                <h3>{col.label}</h3>
                <span>{col.tasks.length}</span>
              </header>
              <div className="tarefas-board-col-body">
                {col.tasks.map((item) => {
                  const overdue = isTaskOverdue(item.dueDate, item.status);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={cn("tarefas-board-card", overdue && "tarefas-board-card--overdue")}
                      onClick={() => setSelected(item)}
                    >
                      <p className="tarefas-board-card-title">{item.title}</p>
                      {item.systemGenerated && (
                        <span className="tarefas-system-tag">Gerada pelo sistema</span>
                      )}
                      <p className="tarefas-board-card-meta">
                        {taskOriginLabel(item.origin, item.companyName)}
                      </p>
                      <div className="tarefas-board-card-foot">
                        <span>
                          {TASK_PRIORITY_LABELS[item.priority as keyof typeof TASK_PRIORITY_LABELS]}
                        </span>
                        <span className={cn(overdue && "tarefas-due-overdue")}>
                          {item.dueDate
                            ? format(new Date(item.dueDate), "dd/MM", { locale: ptBR })
                            : "—"}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {col.tasks.length === 0 && (
                  <p className="tarefas-board-empty">Nenhuma tarefa</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <SystemModalShell
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nova tarefa"
        description="Cadastre uma pendência interna para a operação."
        badges={[
          { label: "Tarefas", variant: "category" },
          { label: "Nova", variant: "status" },
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
              disabled={pending || !title.trim()}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <TaskFormFields
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          priority={priority}
          setPriority={setPriority}
          dueDate={dueDate}
          setDueDate={setDueDate}
          assignedToUserId={assignedToUserId}
          setAssignedToUserId={setAssignedToUserId}
          companyId={companyId}
          setCompanyId={setCompanyId}
          origin={origin}
          setOrigin={setOrigin}
          users={users}
          companies={companies}
        />
      </SystemModalShell>

      <SystemModalShell
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar tarefa"
        description={active?.title}
        badges={[{ label: "Tarefas", variant: "category" }]}
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleEdit()}
              disabled={pending || !title.trim()}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <TaskFormFields
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          priority={priority}
          setPriority={setPriority}
          dueDate={dueDate}
          setDueDate={setDueDate}
          assignedToUserId={assignedToUserId}
          setAssignedToUserId={setAssignedToUserId}
          companyId={companyId}
          setCompanyId={setCompanyId}
          origin={origin}
          setOrigin={setOrigin}
          users={users}
          companies={companies}
        />
      </SystemModalShell>

      <SystemModalShell
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        title="Reatribuir tarefa"
        description={active?.title}
        badges={[{ label: "Responsável", variant: "status" }]}
        className="max-w-md"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setReassignOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleReassign()}
              disabled={pending}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Responsável" wide>
          <select
            value={assignedToUserId}
            onChange={(e) => setAssignedToUserId(e.target.value)}
          >
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
        open={dueOpen}
        onOpenChange={setDueOpen}
        title="Alterar prazo"
        description={active?.title}
        badges={[{ label: "Prazo", variant: "status" }]}
        className="max-w-md"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setDueOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleDueChange()}
              disabled={pending}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Prazo" wide>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </SystemModalField>
      </SystemModalShell>

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.title ?? "Tarefa"}
        description={
          selected?.systemGenerated ? "Gerada pelo sistema" : selected?.createdByName
        }
        size="lg"
        footer={
          selected ? (
            <div className="flex flex-wrap gap-2">
              {selected.linkUrl && (
                <Link
                  href={selected.linkUrl}
                  className={cn(buttonVariants({ variant: "brand", size: "sm" }), "rounded-lg")}
                >
                  Abrir registro
                </Link>
              )}
              {selected.status !== "CONCLUIDA" && selected.status !== "CANCELADA" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await updateTaskStatus(selected.id, "CONCLUIDA");
                      toast.success("Tarefa concluída.");
                      setSelected(null);
                      router.refresh();
                    })
                  }
                >
                  Concluir
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {selected && (
          <dl className="space-y-3 text-sm">
            <DetailRow
              label="Status"
              value={
                <StatusBadge
                  status={selected.status}
                  label={
                    TASK_STATUS_LABELS[selected.status as keyof typeof TASK_STATUS_LABELS] ??
                    selected.status
                  }
                />
              }
            />
            <DetailRow
              label="Prioridade"
              value={
                TASK_PRIORITY_LABELS[selected.priority as keyof typeof TASK_PRIORITY_LABELS] ??
                selected.priority
              }
            />
            <DetailRow
              label="Vinculada a"
              value={taskOriginLabel(selected.origin, selected.companyName)}
            />
            <DetailRow label="Responsável" value={selected.assignedTo?.name ?? "—"} />
            <DetailRow
              label="Prazo"
              value={
                selected.dueDate
                  ? format(new Date(selected.dueDate), "dd/MM/yyyy", { locale: ptBR })
                  : "—"
              }
            />
            {selected.description && (
              <DetailRow label="Descrição" value={selected.description} />
            )}
          </dl>
        )}
      </DetailDrawer>
    </PageModule>
  );
}

function TaskFormFields({
  title,
  setTitle,
  description,
  setDescription,
  priority,
  setPriority,
  dueDate,
  setDueDate,
  assignedToUserId,
  setAssignedToUserId,
  companyId,
  setCompanyId,
  origin,
  setOrigin,
  users,
  companies,
}: {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  priority: string;
  setPriority: (v: string) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  assignedToUserId: string;
  setAssignedToUserId: (v: string) => void;
  companyId: string;
  setCompanyId: (v: string) => void;
  origin: string;
  setOrigin: (v: string) => void;
  users: { id: string; name: string }[];
  companies: { id: string; name: string }[];
}) {
  return (
    <>
      <SystemModalField label="Título" required wide>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
      </SystemModalField>
      <SystemModalField label="Descrição" wide>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição"
        />
      </SystemModalField>
      <SystemModalField label="Responsável" wide>
        <select
          value={assignedToUserId}
          onChange={(e) => setAssignedToUserId(e.target.value)}
        >
          <option value="">Selecione</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </SystemModalField>
      <SystemModalField label="Prioridade">
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </SystemModalField>
      <SystemModalField label="Prazo">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Vínculo (origem)" wide>
        <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
          {Object.entries(TASK_ORIGIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </SystemModalField>
      <SystemModalField label="Empresa (opcional)" wide>
        <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          <option value="">Nenhuma</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </SystemModalField>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-[var(--dash-text-muted)]">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
