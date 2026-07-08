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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createFinancialEntry, updateFinancialEntryStatus } from "@/actions/financial";
import { toast } from "sonner";

type Entry = {
  id: string;
  type: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: string;
  company: { tradeName: string | null; legalName: string } | null;
};

export function FinanceiroClient({ items }: { items: Entry[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"RECEBER" | "PAGAR">("RECEBER");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function handleCreate() {
    const result = await createFinancialEntry({
      type,
      description,
      amount: parseFloat(amount),
      dueDate,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Lançamento criado");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  const totalReceber = items.filter((i) => i.type === "RECEBER" && i.status !== "PAGO").reduce((s, i) => s + i.amount, 0);
  const totalPagar = items.filter((i) => i.type === "PAGAR" && i.status !== "PAGO").reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Contas a receber, pagar e fluxo de caixa"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Novo lançamento</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={type} onValueChange={(v) => setType(v as "RECEBER" | "PAGAR")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEBER">A receber</SelectItem>
                    <SelectItem value="PAGAR">A pagar</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Input type="number" step="0.01" placeholder="Valor" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <Button onClick={handleCreate} disabled={pending || !description || !amount || !dueDate}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">A receber</p><p className="text-2xl font-bold text-emerald-700">R$ {totalReceber.toFixed(2)}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">A pagar</p><p className="text-2xl font-bold text-rose-700">R$ {totalPagar.toFixed(2)}</p></div>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Sem lançamentos" description="Registre contas a receber e a pagar." />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.type === "RECEBER" ? "Receber" : "Pagar"}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>R$ {item.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(item.dueDate, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>
                    {item.status !== "PAGO" && (
                      <Button size="sm" variant="outline" onClick={() => startTransition(async () => {
                        await updateFinancialEntryStatus(item.id, "PAGO");
                        router.refresh();
                      })}>Marcar pago</Button>
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
