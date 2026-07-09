"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, LayoutGrid, List, Trash2, GripVertical } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createTask, deleteTask, updateTask, updateTaskStatus } from "@/actions/tasks";
import {
  TASK_STAT_CARDS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  KANBAN_COLUMNS,
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
  companyName: string | null;
};

type TarefasClientProps = {
  items: TaskItem[];
  total: number;
  statCounts: Record<string, number>;
  users: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  filters: { q?: string; status?: string; priority?: string; card?: string };
};

export function TarefasClient({
  items,
  total,
  statCounts,
  users,
  companies,
  filters,
}: TarefasClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    router.push(`/dashboard/tarefas?${params.toString()}`);
  };

  async function handleCreate() {
    const result = await createTask({
      title,
      description,
      priority: priority as "BAIXA" | "MEDIA" | "ALTA" | "URGENTE",
      assignedToUserId: assignedToUserId || undefined,
      companyId: companyId || undefined,
      dueDate: dueDate || undefined,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Tarefa criada");
    setOpen(false);
    setTitle("");
    setDescription("");
    startTransition(() => router.refresh());
  }

  const kanbanItems = KANBAN_COLUMNS.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    tasks: items.filter((t) => t.status === status),
  }));

  return (
    <div className="referrals-module">
      <PageHeader
        title="Tarefas"
        description="Organize pendências internas da clínica"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === "kanban" ? "list" : "kanban")}>
              {view === "kanban" ? <List className="mr-1 h-4 w-4" /> : <LayoutGrid className="mr-1 h-4 w-4" />}
              {view === "kanban" ? "Lista" : "Kanban"}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Nova tarefa</Button>} />
              <DialogContent>
                <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Título *" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <Textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
                  <Select value={priority} onValueChange={(v) => setPriority(v ?? "MEDIA")}>
                    <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  <Select value={assignedToUserId} onValueChange={(v) => setAssignedToUserId(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Empresa (opcional)" /></SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreate} disabled={pending || !title.trim()}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="referral-stat-grid referral-stat-grid-6 mb-6">
        {TASK_STAT_CARDS.map((card) => (
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
          placeholder="Buscar tarefa..."
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
            {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa"
          description="Crie tarefas para acompanhar pendências da equipe ou aguarde tarefas automáticas de orçamentos aprovados."
          action={{ label: "Nova tarefa", onClick: () => setOpen(true) }}
        />
      ) : view === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {kanbanItems.map((col) => (
            <div key={col.status} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0F3D4A]">
                <GripVertical className="h-4 w-4 text-slate-400" />
                {col.label}
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{col.tasks.length}</span>
              </h3>
              <div className="space-y-2">
                {col.tasks.map((item) => (
                  <TaskCard
                    key={item.id}
                    item={item}
                    onStatusChange={(status) =>
                      startTransition(async () => {
                        await updateTaskStatus(item.id, status);
                        router.refresh();
                      })
                    }
                    onDelete={() =>
                      startTransition(async () => {
                        await deleteTask(item.id);
                        router.refresh();
                      })
                    }
                  />
                ))}
                {col.tasks.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-400">Nenhuma tarefa</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.title}</p>
                    {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                  </TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>{TASK_PRIORITY_LABELS[item.priority as keyof typeof TASK_PRIORITY_LABELS] ?? item.priority}</TableCell>
                  <TableCell>{item.dueDate ? format(new Date(item.dueDate), "dd/MM/yyyy", { locale: ptBR }) : "—"}</TableCell>
                  <TableCell>{item.assignedTo?.name ?? "—"}</TableCell>
                  <TableCell>{item.companyName ?? "—"}</TableCell>
                  <TableCell className="space-x-1">
                    {item.status !== "CONCLUIDA" && (
                      <Button size="sm" variant="outline" onClick={() => startTransition(async () => {
                        await updateTaskStatus(item.id, "CONCLUIDA");
                        router.refresh();
                      })}>Concluir</Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => startTransition(async () => {
                      await deleteTask(item.id);
                      router.refresh();
                    })}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t px-4 py-2 text-xs text-slate-500">{items.length} de {total} tarefas</p>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  item,
  onStatusChange,
  onDelete,
}: {
  item: TaskItem;
  onStatusChange: (status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA") => void;
  onDelete: () => void;
}) {
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "CONCLUIDA";
  return (
    <div className={cn("rounded-lg border bg-white p-3 shadow-sm", isOverdue && "border-amber-300")}>
      <p className="font-medium text-sm text-[#0F3D4A]">{item.title}</p>
      {item.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.description}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        <StatusBadge status={item.priority} />
        {item.dueDate && (
          <span className={cn("text-xs", isOverdue ? "text-amber-600 font-medium" : "text-slate-400")}>
            {format(new Date(item.dueDate), "dd/MM", { locale: ptBR })}
          </span>
        )}
      </div>
      {item.companyName && <p className="mt-1 text-xs text-slate-400">{item.companyName}</p>}
      <div className="mt-2 flex gap-1">
        {item.status === "PENDENTE" && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onStatusChange("EM_ANDAMENTO")}>Iniciar</Button>
        )}
        {item.status !== "CONCLUIDA" && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onStatusChange("CONCLUIDA")}>Concluir</Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={onDelete}>Excluir</Button>
      </div>
    </div>
  );
}
