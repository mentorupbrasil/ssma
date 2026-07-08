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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createMonthlyClosing, updateMonthlyClosingStatus } from "@/actions/closings";
import { toast } from "sonner";

type Closing = {
  id: string;
  referenceMonth: Date;
  status: string;
  totalAmount: number | null;
  company: { tradeName: string | null; legalName: string } | null;
};

export function FechamentoClient({ items }: { items: Closing[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [referenceMonth, setReferenceMonth] = useState("");

  async function handleCreate() {
    const result = await createMonthlyClosing({ referenceMonth });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Fechamento criado");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <PageHeader
        title="Fechamento mensal"
        description="Consolide valores por competência e empresa"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Novo fechamento</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Novo fechamento</DialogTitle></DialogHeader>
              <Input type="month" value={referenceMonth} onChange={(e) => setReferenceMonth(e.target.value + "-01")} />
              <Button className="mt-3" onClick={handleCreate} disabled={pending || !referenceMonth}>Criar</Button>
            </DialogContent>
          </Dialog>
        }
      />
      {items.length === 0 ? (
        <EmptyState title="Nenhum fechamento" description="Crie fechamentos mensais por competência." />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competência</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{format(item.referenceMonth, "MMMM yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>{item.company?.tradeName ?? item.company?.legalName ?? "Geral"}</TableCell>
                  <TableCell>{item.totalAmount != null ? `R$ ${item.totalAmount.toFixed(2)}` : "—"}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>
                    {item.status !== "FECHADO" && (
                      <Button size="sm" variant="outline" onClick={() => startTransition(async () => {
                        await updateMonthlyClosingStatus(item.id, "FECHADO");
                        router.refresh();
                      })}>Fechar</Button>
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
