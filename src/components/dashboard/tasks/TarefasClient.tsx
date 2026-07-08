"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
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
import { createTask, deleteTask, updateTaskStatus } from "@/actions/tasks";
import { toast } from "sonner";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignedTo: { name: string } | null;
};

export function TarefasClient({ items, users }: { items: TaskItem[]; users: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function handleCreate() {
    const result = await createTask({ title, description, assignedToUserId: assignedToUserId || undefined, dueDate: dueDate || undefined });
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

  return (
    <div>
      <PageHeader
        title="Tarefas"
        description="Organize pendências internas da clínica"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Nova tarefa</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <Select value={assignedToUserId} onValueChange={(v) => setAssignedToUserId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreate} disabled={pending || !title.trim()}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      {items.length === 0 ? (
        <EmptyState title="Nenhuma tarefa" description="Crie tarefas para acompanhar pendências da equipe." />
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
                <TableHead className="w-24" />
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
                  <TableCell>{item.priority}</TableCell>
                  <TableCell>{item.dueDate ? format(item.dueDate, "dd/MM/yyyy", { locale: ptBR }) : "—"}</TableCell>
                  <TableCell>{item.assignedTo?.name ?? "—"}</TableCell>
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
        </div>
      )}
    </div>
  );
}
