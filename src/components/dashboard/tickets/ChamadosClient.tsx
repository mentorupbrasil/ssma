"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createTicket, updateTicketStatus } from "@/actions/tickets";
import { toast } from "sonner";

type TicketItem = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
  createdBy: { name: string };
};

export function ChamadosClient({ items, saasMode = false }: { items: TicketItem[]; saasMode?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate() {
    const result = await createTicket({
      subject,
      description,
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

  return (
    <div>
      <PageHeader
        title={saasMode ? "Chamados SaaS" : "Chamados"}
        description={saasMode ? "Suporte entre clínicas e plataforma" : "Suporte interno e solicitações de empresas"}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Abrir chamado</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Novo chamado</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Assunto" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <Textarea placeholder="Descreva o problema" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Button onClick={handleCreate} disabled={pending || !subject.trim() || !description.trim()}>Enviar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      {items.length === 0 ? (
        <EmptyState title="Nenhum chamado" description="Abra um chamado quando precisar de suporte." />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Aberto por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.subject}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                  </TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>{item.priority}</TableCell>
                  <TableCell>{item.createdBy.name}</TableCell>
                  <TableCell>{format(item.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                  <TableCell>
                    {item.status !== "FECHADO" && item.status !== "RESOLVIDO" && (
                      <Button size="sm" variant="outline" onClick={() => startTransition(async () => {
                        await updateTicketStatus(item.id, "RESOLVIDO");
                        router.refresh();
                      })}>Resolver</Button>
                    )}
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
