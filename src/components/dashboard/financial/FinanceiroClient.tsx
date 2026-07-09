"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageShell } from "@/components/dashboard/PageShell";
import { PlatformPositioningBanner } from "@/components/dashboard/PlatformPositioningBanner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { getMetricMeta } from "@/lib/metric-cards";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import { MobileListCard } from "@/components/dashboard/MobileListCard";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createFinancialEntry, updateFinancialEntryStatus } from "@/actions/financial";
import { formatCurrency } from "@/lib/pricing";
import { buildFilterChips } from "@/lib/filter-chips-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const FILTER_LABELS: Record<string, string> = {
  all: "Todas as contas",
  receber: "Em aberto",
  atraso: "Em atraso",
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
  const [selected, setSelected] = useState<Entry | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const receivables = useMemo(() => items.filter((i) => i.type === "RECEBER"), [items]);

  const filtered = useMemo(() => {
    if (filter === "receber") {
      return receivables.filter((i) => i.status !== "PAGO" && i.status !== "CANCELADO");
    }
    if (filter === "atraso") {
      return receivables.filter(
        (i) => i.status === "ATRASADO" || (i.status === "PENDENTE" && i.dueDate < new Date())
      );
    }
    return receivables;
  }, [filter, receivables]);

  const activeChips = useMemo(
    () =>
      buildFilterChips([
        {
          key: "filter",
          value: filter === "all" ? undefined : filter,
          label: (v) => FILTER_LABELS[v] ?? v,
        },
      ]),
    [filter]
  );

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
    toast.success("Conta a receber registrada.");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Comercial e financeiro"
        title="Financeiro"
        description="Central de contas a receber — fechamentos, orçamentos e lançamentos avulsos."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="brand"><Plus className="mr-2 h-4 w-4" />Nova conta a receber</Button>} />
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Registrar conta a receber</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Input type="number" step="0.01" placeholder="Valor" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <Button onClick={handleCreate} disabled={pending || !description || !amount || !dueDate} className="w-full" variant="brand">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <PlatformPositioningBanner compact />

      <section>
        <h2 className="section-label">Resumo financeiro</h2>
        <MetricGrid>
          {(
            [
              {
                key: "receivable_month",
                label: "A receber no mês",
                value: formatCurrency(summary.receivableMonth),
              },
              {
                key: "received",
                label: "Recebido",
                value: formatCurrency(summary.received),
              },
              {
                key: "overdue",
                label: "Em atraso",
                value: formatCurrency(summary.overdue),
                badge: summary.overdue > 0 ? "Ação necessária" : undefined,
              },
              {
                key: "awaiting_invoice",
                label: "Aguardando faturamento",
                value: summary.awaitingInvoice,
              },
              {
                key: "pending_companies",
                label: "Empresas pendentes",
                value: summary.pendingCompanies,
              },
            ] satisfies Array<{
              key: string;
              label: string;
              value: string | number;
              badge?: string;
            }>
          ).map((item) => {
            const meta = getMetricMeta(`finance:${item.key}`);
            return (
              <MetricCard
                key={item.key}
                label={item.label}
                value={item.value}
                icon={meta.icon}
                description={meta.description}
                variant={meta.tone}
                badge={item.badge ?? meta.badge}
              />
            );
          })}
        </MetricGrid>
      </section>

      <FilterBar
        activeChips={activeChips}
        onRemoveChip={() => setFilter("all")}
        onClearChips={() => setFilter("all")}
      >
        <div className="sm:col-span-2">
          <Label className="text-xs text-[var(--dash-text-muted)]">Exibir</Label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="form-select mt-1 h-10 w-full"
          >
            <option value="all">Todas as contas a receber</option>
            <option value="receber">Em aberto</option>
            <option value="atraso">Em atraso</option>
          </select>
        </div>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhuma conta a receber"
          description="Contas são geradas ao fechar produção mensal ou aprovar orçamentos. Você também pode registrar avulsos manualmente."
          action={{ label: "Ir para fechamento", href: "/dashboard/fechamento-mensal" }}
          secondaryAction={{ label: "Ver orçamentos", href: "/dashboard/orcamentos", variant: "outline" }}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(item)}
                    >
                      <TableCell>{item.company?.tradeName ?? item.company?.legalName ?? "Não informado"}</TableCell>
                      <TableCell>{SOURCE_LABELS[item.source] ?? item.source}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{format(item.dueDate, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell className={cn("financial-value text-right", item.status === "ATRASADO" && "financial-value--overdue", item.status === "PAGO" && "financial-value--paid")}>
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {item.status !== "PAGO" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await updateFinancialEntryStatus(item.id, "PAGO");
                                toast.success("Pagamento registrado.");
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
            </DataTable>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((item) => (
              <MobileListCard
                key={item.id}
                icon={Wallet}
                title={item.company?.tradeName ?? item.company?.legalName ?? "Não informado"}
                subtitle={item.description}
                meta={`${format(item.dueDate, "dd/MM/yyyy", { locale: ptBR })} · ${formatCurrency(item.amount)}`}
                badge={<StatusBadge status={item.status} />}
                onClick={() => setSelected(item)}
              />
            ))}
          </div>
        </>
      )}

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.description ?? "Conta a receber"}
        description={selected ? formatCurrency(selected.amount) : undefined}
        size="lg"
        footer={
          selected && selected.status !== "PAGO" ? (
            <Button
              variant="brand"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await updateFinancialEntryStatus(selected.id, "PAGO");
                  toast.success("Pagamento registrado.");
                  setSelected(null);
                  router.refresh();
                })
              }
            >
              Marcar como pago
            </Button>
          ) : undefined
        }
      >
        {selected && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-[var(--dash-text-muted)]">Cliente</dt>
              <dd className="font-medium">{selected.company?.tradeName ?? selected.company?.legalName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-[var(--dash-text-muted)]">Origem</dt>
              <dd>{SOURCE_LABELS[selected.source] ?? selected.source}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-[var(--dash-text-muted)]">Vencimento</dt>
              <dd>{format(selected.dueDate, "dd/MM/yyyy", { locale: ptBR })}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-[var(--dash-text-muted)]">Status</dt>
              <dd><StatusBadge status={selected.status} /></dd>
            </div>
            {selected.invoiceNumber && (
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--dash-text-muted)]">NF</dt>
                <dd>{selected.invoiceNumber}</dd>
              </div>
            )}
          </dl>
        )}
      </DetailDrawer>
    </PageShell>
  );
}
