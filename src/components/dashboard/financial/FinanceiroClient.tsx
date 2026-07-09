"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PlatformPositioningBanner } from "@/components/dashboard/PlatformPositioningBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createFinancialEntry, updateFinancialEntryStatus } from "@/actions/financial";
import { formatCurrency } from "@/lib/pricing";
import { toast } from "sonner";

type Entry = {
  id: string;
  type: string;
  source: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: string;
  paymentMethod: string | null;
  invoiceNumber: string | null;
  company: { tradeName: string | null; legalName: string } | null;
  closing: { id: string; referenceMonth: Date } | null;
};

type Summary = {
  receivableMonth: number;
  received: number;
  overdue: number;
  awaitingInvoice: number;
  pendingCompanies: number;
};

const SOURCE_LABELS: Record<string, string> = {
  FECHAMENTO: "Fechamento",
  ORCAMENTO: "Orçamento",
  AVULSO: "Avulso",
  CONTRATO: "Contrato",
  MANUAL: "Manual",
};

export function FinanceiroClient({
  items,
  summary,
}: {
  items: Entry[];
  summary: Summary;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "receber" | "atraso">("all");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const receivables = useMemo(
    () => items.filter((i) => i.type === "RECEBER"),
    [items]
  );

  const filtered = useMemo(() => {
    if (filter === "receber") {
      return receivables.filter((i) => i.status !== "PAGO" && i.status !== "CANCELADO");
    }
    if (filter === "atraso") {
      return receivables.filter((i) => i.status === "ATRASADO" || i.status === "PENDENTE" && i.dueDate < new Date());
    }
    return receivables;
  }, [filter, receivables]);

  async function handleCreate() {
    const result = await createFinancialEntry({
      type: "RECEBER",
      source: "AVULSO",
      description,
      amount: parseFloat(amount),
      dueDate,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Conta a receber registrada");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Central de contas a receber da produção ocupacional — fechamentos, orçamentos e avulsos"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="brand"><Plus className="mr-2 h-4 w-4" />Nova conta a receber</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar conta a receber</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Input type="number" step="0.01" placeholder="Valor" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <Button onClick={handleCreate} disabled={pending || !description || !amount || !dueDate} className="w-full">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <PlatformPositioningBanner compact />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="A receber no mês" value={formatCurrency(summary.receivableMonth)} icon={Wallet} />
        <StatCard title="Recebido" value={formatCurrency(summary.received)} icon={Wallet} />
        <StatCard title="Em atraso" value={formatCurrency(summary.overdue)} icon={Wallet} />
        <StatCard title="Aguardando faturamento" value={summary.awaitingInvoice} icon={Wallet} />
        <StatCard title="Empresas pendentes" value={summary.pendingCompanies} icon={Wallet} />
      </div>

      <div className="w-full sm:w-64">
        <Label>Filtro</Label>
        <Select value={filter} onValueChange={(v) => v && setFilter(v as typeof filter)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas a receber</SelectItem>
            <SelectItem value="receber">Em aberto</SelectItem>
            <SelectItem value="atraso">Em atraso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhuma conta a receber"
          description="Contas são geradas automaticamente ao fechar produção mensal ou aprovar orçamentos. Você também pode registrar avulsos manualmente."
          action={{ label: "Ir para fechamento", href: "/dashboard/fechamento-mensal" }}
          secondaryAction={{ label: "Ver orçamentos", href: "/dashboard/orcamentos", variant: "outline" }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.company?.tradeName ?? item.company?.legalName ?? "Não informado"}</TableCell>
                  <TableCell>{SOURCE_LABELS[item.source] ?? item.source}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{format(item.dueDate, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(item.amount)}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>
                    {item.status !== "PAGO" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateFinancialEntryStatus(item.id, "PAGO");
                            router.refresh();
                          })
                        }
                      >
                        Marcar pago
                      </Button>
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
