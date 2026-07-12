"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Ban,
  Eye,
  FileCheck,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  attachFinancialReceipt,
  cancelFinancialEntry,
  createFinancialEntry,
  markFinancialReceived,
  registerFinancialInvoice,
  updateFinancialEntry,
} from "@/actions/financial";
import {
  RECEIVABLE_STATUS_FILTER_OPTIONS,
  decodeReceiptRef,
  formatReceivableCompetenceDescription,
  receivableStatusLabel,
  receivableStatusToneKey,
  resolveReceivableDisplayStatus,
} from "@/lib/financial";
import { formatCurrency } from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Entry = {
  id: string;
  source: string;
  description: string;
  amount: number;
  dueDate: string;
  createdAt: string;
  status: string;
  paymentMethod: string | null;
  invoiceNumber: string | null;
  category: string | null;
  referenceMonth: string | null;
  companyId: string | null;
  companyName: string;
  closingId: string | null;
  closingStatus: string | null;
  closingCompetence: string | null;
  amountLocked: boolean;
};

type CompanyOption = { id: string; label: string };

type Summary = {
  aReceber: number;
  vencido: number;
  recebidoMes: number;
};

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}

function toMonthInput(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 7);
}

export function FinanceiroClient({
  items,
  companies,
  summary,
}: {
  items: Entry[];
  companies: CompanyOption[];
  summary: Summary;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState("");
  const [competence, setCompetence] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [active, setActive] = useState<Entry | null>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [referenceMonth, setReferenceMonth] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const competenceOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      const iso = item.referenceMonth?.slice(0, 7);
      if (!iso) continue;
      map.set(iso, item.closingCompetence ?? iso);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (q.trim()) {
        const term = q.toLowerCase();
        const hay = `${item.companyName} ${item.description}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (competence) {
        const itemMonth = item.referenceMonth?.slice(0, 7) ?? "";
        if (itemMonth !== competence) return false;
      }
      if (dueFilter) {
        if (toDateInput(item.dueDate) !== dueFilter) return false;
      }
      if (statusFilter) {
        const display = resolveReceivableDisplayStatus(item);
        if (display !== statusFilter) return false;
      }
      return true;
    });
  }, [items, q, competence, dueFilter, statusFilter]);

  function openCreate() {
    setDescription("");
    setAmount("");
    setDueDate("");
    setCompanyId("");
    setReferenceMonth("");
    setCreateOpen(true);
  }

  function openEdit(item: Entry) {
    setActive(item);
    setDescription(item.description);
    setAmount(String(item.amount));
    setDueDate(toDateInput(item.dueDate));
    setCompanyId(item.companyId ?? "");
    setReferenceMonth(toMonthInput(item.referenceMonth));
    setEditOpen(true);
  }

  function openInvoice(item: Entry) {
    setActive(item);
    setInvoiceNumber(item.invoiceNumber ?? "");
    setInvoiceOpen(true);
  }

  function openReceipt(item: Entry) {
    setActive(item);
    setReceiptUrl(decodeReceiptRef(item.category) ?? "");
    setReceiptOpen(true);
  }

  function openReceive(item: Entry) {
    setActive(item);
    setPaidAt(format(new Date(), "yyyy-MM-dd"));
    setPaymentMethod(item.paymentMethod ?? "");
    setReceiveOpen(true);
  }

  async function handleCreate() {
    const result = await createFinancialEntry({
      type: "RECEBER",
      source: "AVULSO",
      description,
      amount: parseFloat(amount),
      dueDate,
      companyId: companyId || undefined,
      referenceMonth: referenceMonth || undefined,
      status: "PENDENTE",
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Conta a receber criada.");
    setCreateOpen(false);
    startTransition(() => router.refresh());
  }

  async function handleEdit() {
    if (!active) return;
    const parsedAmount = parseFloat(amount);
    const result = await updateFinancialEntry({
      id: active.id,
      description,
      amount: active.amountLocked ? active.amount : parsedAmount,
      dueDate,
      companyId: companyId || null,
      referenceMonth: referenceMonth || null,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Conta atualizada.");
    setEditOpen(false);
    setActive(null);
    startTransition(() => router.refresh());
  }

  async function handleInvoice() {
    if (!active) return;
    const result = await registerFinancialInvoice({
      id: active.id,
      invoiceNumber,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Faturamento registrado.");
    setInvoiceOpen(false);
    setActive(null);
    startTransition(() => router.refresh());
  }

  async function handleReceipt() {
    if (!active) return;
    const result = await attachFinancialReceipt({
      id: active.id,
      receiptUrl,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Comprovante anexado.");
    setReceiptOpen(false);
    setActive(null);
    startTransition(() => router.refresh());
  }

  async function handleReceive() {
    if (!active) return;
    const result = await markFinancialReceived({
      id: active.id,
      paidAt: paidAt || undefined,
      paymentMethod: paymentMethod || undefined,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Conta marcada como recebida.");
    setReceiveOpen(false);
    setActive(null);
    setSelected(null);
    startTransition(() => router.refresh());
  }

  async function handleCancel(item: Entry) {
    const result = await cancelFinancialEntry(item.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Conta cancelada.");
    if (selected?.id === item.id) setSelected(null);
    startTransition(() => router.refresh());
  }

  function rowActions(item: Entry): SystemActionItem[] {
    const closed = item.status === "PAGO" || item.status === "CANCELADO";
    return [
      {
        label: "Ver detalhes",
        hint: "Resumo da conta",
        icon: Eye,
        iconTone: "view",
        onClick: () => setSelected(item),
      },
      {
        label: "Editar",
        hint: item.amountLocked
          ? "Valor bloqueado pelo fechamento"
          : "Alterar dados da conta",
        icon: Pencil,
        iconTone: "docs",
        onClick: () => openEdit(item),
        disabled: closed || pending,
      },
      {
        label: "Registrar faturamento",
        hint: "Informar NF / faturamento",
        icon: FileCheck,
        iconTone: "quote",
        onClick: () => openInvoice(item),
        disabled: closed || pending,
      },
      {
        label: "Marcar como recebida",
        hint: "Registrar pagamento",
        icon: Wallet,
        iconTone: "done",
        onClick: () => openReceive(item),
        disabled: closed || pending,
      },
      {
        label: "Anexar comprovante",
        hint: "Link ou referência do comprovante",
        icon: Paperclip,
        iconTone: "schedule",
        onClick: () => openReceipt(item),
        disabled: pending,
      },
      {
        label: "Cancelar",
        hint: "Cancelar esta conta",
        icon: Ban,
        iconTone: "cancel",
        onClick: () => void handleCancel(item),
        disabled: closed || pending,
      },
    ];
  }

  const hasFilters = Boolean(q || competence || dueFilter || statusFilter);

  return (
    <PageShell width="wide" className="financeiro-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Financeiro</h1>
          <p className="colaboradores-empresa-subtitle">
            Central de contas a receber da Unimetra.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Button variant="brand" size="sm" className="rounded-lg" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova conta a receber
          </Button>
        </div>
      </header>

      <div className="financeiro-resumo" aria-label="Resumo de contas a receber">
        <div className="financeiro-resumo-item">
          <span className="financeiro-resumo-label">A receber</span>
          <span className="financeiro-resumo-value">{formatCurrency(summary.aReceber)}</span>
        </div>
        <div className="financeiro-resumo-item">
          <span className="financeiro-resumo-label">Vencido</span>
          <span
            className={cn(
              "financeiro-resumo-value",
              summary.vencido > 0 && "financeiro-resumo-value--danger"
            )}
          >
            {formatCurrency(summary.vencido)}
          </span>
        </div>
        <div className="financeiro-resumo-item">
          <span className="financeiro-resumo-label">Recebido no mês</span>
          <span className="financeiro-resumo-value financeiro-resumo-value--ok">
            {formatCurrency(summary.recebidoMes)}
          </span>
        </div>
      </div>

      <div className="tabela-precos-filters financeiro-filters">
        <div className="tabela-precos-search">
          <Search className="tabela-precos-search-icon" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar empresa ou descrição"
            className="tabela-precos-search-input"
          />
        </div>
        <select
          className="tabela-precos-select"
          value={competence}
          onChange={(e) => setCompetence(e.target.value)}
          aria-label="Competência"
        >
          <option value="">Competência</option>
          {competenceOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="tabela-precos-select"
          value={dueFilter}
          onChange={(e) => setDueFilter(e.target.value)}
          aria-label="Vencimento"
          title="Vencimento"
        />
        <select
          className="tabela-precos-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Status"
        >
          <option value="">Status</option>
          {RECEIVABLE_STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
              setCompetence("");
              setDueFilter("");
              setStatusFilter("");
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          compact
          title={
            hasFilters || items.length > 0
              ? "Nenhuma conta encontrada"
              : "Nenhuma conta a receber"
          }
          description={
            hasFilters || items.length > 0
              ? "Ajuste a busca ou os filtros."
              : "As contas aparecerão aqui após o fechamento mensal ou por lançamento avulso."
          }
          action={
            hasFilters || items.length > 0
              ? undefined
              : { label: "Nova conta a receber", onClick: openCreate }
          }
          secondaryAction={
            hasFilters || items.length > 0
              ? undefined
              : {
                  label: "Ir para fechamento mensal",
                  href: "/dashboard/fechamento-mensal",
                  variant: "outline",
                }
          }
        />
      ) : (
        <div className="colaboradores-empresa-table-wrap">
          <div className="colaboradores-empresa-table-scroll">
            <Table className="colaboradores-empresa-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Competência/Descrição</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const display = resolveReceivableDisplayStatus(item);
                  const desc = formatReceivableCompetenceDescription({
                    description: item.description,
                    referenceMonth: item.referenceMonth,
                    closingReferenceMonth: item.referenceMonth,
                  });
                  const competenceLine = item.closingCompetence
                    ? `${item.closingCompetence} · ${item.description}`
                    : desc.line;
                  return (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(item)}
                    >
                      <TableCell className="font-medium">{item.companyName}</TableCell>
                      <TableCell>
                        <span className="financeiro-desc">{competenceLine}</span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold tabular-nums",
                          display === "VENCIDA" && "financial-value--overdue",
                          display === "RECEBIDA" && "financial-value--paid"
                        )}
                      >
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={receivableStatusToneKey(display)}
                          label={receivableStatusLabel(display)}
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
        </div>
      )}

      <SystemModalShell
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nova conta a receber"
        description="Lançamento avulso fora do fechamento mensal."
        badges={[
          { label: "Financeiro", variant: "category" },
          { label: "Avulso", variant: "status" },
        ]}
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => setCreateOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleCreate()}
              disabled={pending || !description || !amount || !dueDate}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Empresa" wide>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">Selecione (opcional)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </SystemModalField>
        <SystemModalField label="Descrição" required wide>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
          />
        </SystemModalField>
        <SystemModalField label="Competência">
          <input
            type="month"
            value={referenceMonth}
            onChange={(e) => setReferenceMonth(e.target.value)}
          />
        </SystemModalField>
        <SystemModalField label="Valor (R$)" required>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </SystemModalField>
        <SystemModalField label="Vencimento" required>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </SystemModalField>
      </SystemModalShell>

      <SystemModalShell
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar conta"
        description={active?.companyName}
        badges={[{ label: "Financeiro", variant: "category" }]}
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => setEditOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleEdit()}
              disabled={pending}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Empresa" wide>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">Selecione</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </SystemModalField>
        <SystemModalField label="Descrição" required wide>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </SystemModalField>
        <SystemModalField label="Competência">
          <input
            type="month"
            value={referenceMonth}
            onChange={(e) => setReferenceMonth(e.target.value)}
          />
        </SystemModalField>
        <SystemModalField label="Valor (R$)" required>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={active?.amountLocked}
          />
        </SystemModalField>
        {active?.amountLocked && (
          <p className="exam-modal-item exam-modal-item--wide text-xs text-slate-500">
            Valor originado do fechamento mensal. Reabra o fechamento para alterar.
          </p>
        )}
        <SystemModalField label="Vencimento" required>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </SystemModalField>
      </SystemModalShell>

      <SystemModalShell
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        title="Registrar faturamento"
        description={active?.description}
        badges={[{ label: "Faturamento", variant: "status" }]}
        className="max-w-md"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setInvoiceOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleInvoice()}
              disabled={pending || !invoiceNumber.trim()}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Número da NF / faturamento" required wide>
          <input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Ex.: NF 12345"
          />
        </SystemModalField>
      </SystemModalShell>

      <SystemModalShell
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        title="Marcar como recebida"
        description={active ? formatCurrency(active.amount) : undefined}
        badges={[{ label: "Recebimento", variant: "status" }]}
        className="max-w-md"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setReceiveOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleReceive()}
              disabled={pending}
            >
              Confirmar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Data do recebimento" required>
          <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </SystemModalField>
        <SystemModalField label="Forma de pagamento" wide>
          <input
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="PIX, boleto, transferência…"
          />
        </SystemModalField>
      </SystemModalShell>

      <SystemModalShell
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        title="Anexar comprovante"
        description={active?.description}
        badges={[{ label: "Comprovante", variant: "status" }]}
        className="max-w-md"
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setReceiptOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleReceipt()}
              disabled={pending || !receiptUrl.trim()}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Link ou referência do comprovante" required wide>
          <input
            value={receiptUrl}
            onChange={(e) => setReceiptUrl(e.target.value)}
            placeholder="https://… ou referência interna"
          />
        </SystemModalField>
      </SystemModalShell>

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.companyName ?? "Conta a receber"}
        description={selected?.description}
        size="lg"
        footer={
          selected && selected.status !== "PAGO" && selected.status !== "CANCELADO" ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                Editar
              </Button>
              <Button variant="brand" size="sm" onClick={() => openReceive(selected)}>
                Marcar como recebida
              </Button>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <dl className="space-y-3 text-sm">
            <DetailRow label="Empresa" value={selected.companyName} />
            <DetailRow
              label="Competência"
              value={selected.closingCompetence ?? "—"}
            />
            <DetailRow label="Descrição" value={selected.description} />
            <DetailRow
              label="Emissão"
              value={format(new Date(selected.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            />
            <DetailRow
              label="Vencimento"
              value={format(new Date(selected.dueDate), "dd/MM/yyyy", { locale: ptBR })}
            />
            <DetailRow label="Valor" value={formatCurrency(selected.amount)} />
            <DetailRow
              label="Status"
              value={
                <StatusBadge
                  status={receivableStatusToneKey(resolveReceivableDisplayStatus(selected))}
                  label={receivableStatusLabel(resolveReceivableDisplayStatus(selected))}
                />
              }
            />
            {selected.invoiceNumber && (
              <DetailRow label="Faturamento" value={selected.invoiceNumber} />
            )}
            {selected.paymentMethod && (
              <DetailRow label="Pagamento" value={selected.paymentMethod} />
            )}
            {decodeReceiptRef(selected.category) && (
              <DetailRow label="Comprovante" value={decodeReceiptRef(selected.category)!} />
            )}
            {selected.closingId && (
              <DetailRow label="Origem" value="Fechamento mensal" />
            )}
          </dl>
        )}
      </DetailDrawer>
    </PageShell>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-[var(--dash-text-muted)]">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
