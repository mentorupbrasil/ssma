"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Calculator,
  Download,
  FileSpreadsheet,
  FolderOpen,
  Lock,
  Plus,
  RotateCcw,
  Send,
  Upload,
  Wrench,
} from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import {
  ClosingPipeline,
  type ClosingPipelineStep,
} from "@/components/dashboard/closings/ClosingPipeline";
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
  closeMonthlyClosing,
  createMonthlyClosing,
  getClosingDetail,
  reopenMonthlyClosing,
  sendClosingToFinance,
  type ClosingDetailSerialized,
} from "@/actions/closings";
import { importProductionCsv } from "@/actions/production-import";
import {
  canCloseClosing,
  canReopenClosing,
  canSendToFinance,
  closingSituationLabel,
  closingStatusLabel,
  isCriticalSituation,
} from "@/lib/closings";
import { formatCurrency } from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ClosingRow = {
  id: string;
  referenceMonth: string;
  competenceLabel: string;
  status: string;
  totalAmount: number | null;
  importedCount: number;
  withoutPriceCount: number;
  divergenceCount: number;
  companyId: string;
  companyName: string;
  hasFinancialEntry: boolean;
};

type CompanyOption = { id: string; label: string };

function formatAppliedPrice(value: number | null, situation: string) {
  if (situation === "SEM_PRECO" || value == null || value <= 0) return "Sem preço";
  return formatCurrency(value);
}

function formatItemDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

function exportClosingCsv(detail: ClosingDetailSerialized) {
  const header = [
    "Colaborador",
    "Exame/serviço",
    "Data",
    "Quantidade",
    "Preço aplicado",
    "Total",
    "Situação",
  ];
  const lines = detail.lineItems.map((item) =>
    [
      item.patientName ?? "",
      item.serviceName,
      formatItemDate(item.serviceDate),
      String(item.quantity),
      formatAppliedPrice(item.unitPrice, item.situation),
      formatAppliedPrice(item.totalPrice, item.situation),
      closingSituationLabel(item.situation),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(";")
  );
  const blob = new Blob([[header.join(";"), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fechamento-${detail.competenceLabel.replace("/", "-")}-${detail.companyName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FechamentoClient({
  items,
  companies,
}: {
  items: ClosingRow[];
  companies: CompanyOption[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [referenceMonth, setReferenceMonth] = useState("");
  const [createCompanyId, setCreateCompanyId] = useState("");
  const [importMonth, setImportMonth] = useState("");

  const [filterCompetence, setFilterCompetence] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [detail, setDetail] = useState<ClosingDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const competenceOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      const key = item.referenceMonth.slice(0, 7);
      map.set(key, item.competenceLabel);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterCompetence && !item.referenceMonth.startsWith(filterCompetence)) return false;
      if (filterCompany && item.companyId !== filterCompany) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      return true;
    });
  }, [items, filterCompetence, filterCompany, filterStatus]);

  const pipelineStep: ClosingPipelineStep = useMemo(() => {
    if (items.some((i) => i.status === "FATURADO" || i.hasFinancialEntry)) return "send";
    if (items.some((i) => i.status === "FECHADO")) return "close";
    if (items.some((i) => i.status === "COM_DIVERGENCIA" || i.withoutPriceCount > 0 || i.divergenceCount > 0)) {
      return "fix";
    }
    if (items.some((i) => i.status === "EM_CONFERENCIA" || i.status === "AGUARDANDO_APROVACAO")) {
      return "review";
    }
    return items.length > 0 ? "review" : "import";
  }, [items]);

  async function openConference(id: string) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await getClosingDetail(id);
      if (!data) {
        toast.error("Fechamento não encontrado.");
        return;
      }
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCreate() {
    if (!referenceMonth || !createCompanyId) {
      toast.error("Informe competência e empresa.");
      return;
    }
    const result = await createMonthlyClosing({
      referenceMonth,
      companyId: createCompanyId,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Fechamento criado.");
    setCreateOpen(false);
    setReferenceMonth("");
    setCreateCompanyId("");
    startTransition(() => router.refresh());
  }

  async function handleImportFile(file: File) {
    if (!importMonth) {
      toast.error("Selecione a competência da importação.");
      return;
    }
    const csvText = await file.text();
    const result = await importProductionCsv({
      referenceMonth: importMonth,
      fileName: file.name,
      csvText,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const created = result.stats.closingsCreated ?? 0;
    toast.success(
      `Importação concluída: ${result.stats.totalRows} registros · ${created} fechamento(s) por empresa.`
    );
    setImportOpen(false);
    startTransition(() => router.refresh());
  }

  async function handleClose(id: string) {
    const result = await closeMonthlyClosing(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Competência fechada.");
    if (detail?.id === id) await openConference(id);
    startTransition(() => router.refresh());
  }

  async function handleReopen(id: string) {
    const result = await reopenMonthlyClosing(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Fechamento reaberto.");
    if (detail?.id === id) await openConference(id);
    startTransition(() => router.refresh());
  }

  async function handleSendFinance(id: string) {
    const result = await sendClosingToFinance(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Valor enviado ao Financeiro.");
    if (detail?.id === id) await openConference(id);
    startTransition(() => router.refresh());
  }

  function rowActions(item: ClosingRow): SystemActionItem[] {
    return [
      {
        label: "Abrir conferência",
        hint: "Ver itens da empresa",
        icon: FolderOpen,
        iconTone: "view",
        onClick: () => void openConference(item.id),
      },
      {
        label: "Corrigir pendências",
        hint: "Revisar divergências e preços",
        icon: Wrench,
        iconTone: "progress",
        onClick: () => void openConference(item.id),
        disabled: item.withoutPriceCount === 0 && item.divergenceCount === 0,
      },
      {
        label: "Fechar competência",
        hint: "Bloqueia alterações e confirma o total",
        icon: Lock,
        iconTone: "done",
        onClick: () => void handleClose(item.id),
        disabled:
          pending ||
          !canCloseClosing(item.status, item.withoutPriceCount + item.divergenceCount),
      },
      {
        label: "Reabrir fechamento",
        hint: "Voltar para conferência",
        icon: RotateCcw,
        iconTone: "schedule",
        onClick: () => void handleReopen(item.id),
        disabled: pending || !canReopenClosing(item.status) || item.status === "FATURADO",
      },
      {
        label: "Enviar ao financeiro",
        hint: "Gera cobrança no módulo Financeiro",
        icon: Send,
        iconTone: "quote",
        onClick: () => void handleSendFinance(item.id),
        disabled: pending || !canSendToFinance(item.status),
      },
      {
        label: "Exportar relatório",
        hint: "Baixar CSV dos itens",
        icon: Download,
        iconTone: "docs",
        onClick: () => {
          void (async () => {
            const data = detail?.id === item.id ? detail : await getClosingDetail(item.id);
            if (!data) {
              toast.error("Não foi possível exportar.");
              return;
            }
            exportClosingCsv(data);
          })();
        },
      },
    ];
  }

  return (
    <PageShell width="wide" className="fechamento-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Fechamento mensal</h1>
          <p className="colaboradores-empresa-subtitle">
            Importe a produção, confira por empresa e envie o valor final ao Financeiro.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Button variant="brand" size="sm" className="rounded-lg" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar produção
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar fechamento
          </Button>
        </div>
      </header>

      <ClosingPipeline activeStep={pipelineStep} className="mb-3" />

      <div className="tabela-precos-filters fechamento-filters">
        <select
          className="tabela-precos-select"
          value={filterCompetence}
          onChange={(e) => setFilterCompetence(e.target.value)}
          aria-label="Competência"
        >
          <option value="">Competência</option>
          {competenceOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="tabela-precos-select"
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          aria-label="Empresa"
        >
          <option value="">Empresa</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="tabela-precos-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Status"
        >
          <option value="">Status</option>
          <option value="EM_CONFERENCIA">Em conferência</option>
          <option value="COM_DIVERGENCIA">Com pendências</option>
          <option value="AGUARDANDO_APROVACAO">Pronto para fechar</option>
          <option value="FECHADO">Fechado</option>
          <option value="FATURADO">Enviado ao financeiro</option>
        </select>
        {(filterCompetence || filterCompany || filterStatus) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterCompetence("");
              setFilterCompany("");
              setFilterStatus("");
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="Nenhum fechamento"
          description="Importe a produção mensal para gerar um fechamento por empresa, conferir preços e enviar ao Financeiro."
          action={{ label: "Importar produção", onClick: () => setImportOpen(true) }}
          secondaryAction={{
            label: "Criar fechamento",
            onClick: () => setCreateOpen(true),
            variant: "outline",
          }}
        />
      ) : (
        <div className="colaboradores-empresa-table-wrap">
          <div className="colaboradores-empresa-table-scroll">
            <Table className="colaboradores-empresa-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Atendimentos</TableHead>
                  <TableHead>Itens sem preço</TableHead>
                  <TableHead>Divergências</TableHead>
                  <TableHead className="text-right">Valor total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => void openConference(item.id)}
                  >
                    <TableCell>{item.competenceLabel}</TableCell>
                    <TableCell className="font-medium">{item.companyName}</TableCell>
                    <TableCell>{item.importedCount}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          item.withoutPriceCount > 0 && "fechamento-cell-warn"
                        )}
                      >
                        {item.withoutPriceCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          item.divergenceCount > 0 && "fechamento-cell-warn"
                        )}
                      >
                        {item.divergenceCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {item.totalAmount != null ? formatCurrency(item.totalAmount) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={item.status}
                        label={closingStatusLabel(item.status)}
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
        </div>
      )}

      <SystemModalShell
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar produção"
        description="CSV com colunas: empresa, CNPJ, colaborador, CPF, data, tipo_exame, protocolo, valor. Gera um fechamento por empresa."
        badges={[
          { label: "Fechamento", variant: "category" },
          { label: "Importação", variant: "status" },
        ]}
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => setImportOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => fileRef.current?.click()}
              disabled={pending || !importMonth}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Selecionar planilha
            </Button>
          </div>
        }
      >
        <SystemModalField label="Competência" required wide>
          <Input
            type="month"
            value={importMonth}
            onChange={(e) => setImportMonth(e.target.value)}
          />
        </SystemModalField>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportFile(file);
            e.target.value = "";
          }}
        />
      </SystemModalShell>

      <SystemModalShell
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Criar fechamento"
        description="Crie um fechamento vazio para uma empresa e competência."
        badges={[
          { label: "Fechamento", variant: "category" },
          { label: "Manual", variant: "status" },
        ]}
        className="max-w-md"
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
              disabled={pending || !referenceMonth || !createCompanyId}
            >
              Criar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Competência" required wide>
          <Input
            type="month"
            value={referenceMonth}
            onChange={(e) => setReferenceMonth(e.target.value)}
          />
        </SystemModalField>
        <SystemModalField label="Empresa" required wide>
          <select
            value={createCompanyId}
            onChange={(e) => setCreateCompanyId(e.target.value)}
          >
            <option value="">Selecione</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </SystemModalField>
      </SystemModalShell>

      <DetailDrawer
        open={!!detail || detailLoading}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        title={detail ? `Conferência — ${detail.companyName}` : "Conferência"}
        description={
          detail
            ? `${detail.competenceLabel} · ${closingStatusLabel(detail.status)}`
            : "Carregando itens…"
        }
        size="xl"
        footer={
          detail ? (
            <div className="flex flex-wrap gap-2">
              {canCloseClosing(detail.status, detail.criticalCount) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => void handleClose(detail.id)}
                >
                  Fechar competência
                </Button>
              )}
              {canSendToFinance(detail.status) && (
                <Button
                  variant="brand"
                  size="sm"
                  disabled={pending}
                  onClick={() => void handleSendFinance(detail.id)}
                >
                  Enviar ao financeiro
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportClosingCsv(detail)}
              >
                Exportar
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailLoading && !detail ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : detail ? (
          <div className="space-y-3">
            {detail.criticalCount > 0 && (
              <div className="fechamento-alert">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>
                  {detail.criticalCount} divergência(s) crítica(s). Corrija antes de fechar ou
                  enviar ao Financeiro.
                </p>
              </div>
            )}

            <div className="fechamento-detail-meta">
              <span>{detail.importedCount} atendimentos</span>
              <span>{detail.withoutPriceCount} sem preço</span>
              <span>{detail.divergenceCount} divergências</span>
              <span className="font-semibold">
                {detail.totalAmount != null ? formatCurrency(detail.totalAmount) : "—"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Exame/serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Preço aplicado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-slate-500">
                        Nenhum item neste fechamento. Importe a produção para popular os
                        atendimentos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    detail.lineItems.map((item) => {
                      const critical = isCriticalSituation(item.situation);
                      const warn = item.situation === "FORA_PACOTE";
                      return (
                        <TableRow
                          key={item.id}
                          className={cn(
                            critical && "fechamento-row-critical",
                            warn && "fechamento-row-warn"
                          )}
                        >
                          <TableCell>{item.patientName ?? "—"}</TableCell>
                          <TableCell>{item.serviceName}</TableCell>
                          <TableCell>{formatItemDate(item.serviceDate)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell
                            className={cn(
                              !item.hasPrice && "fechamento-cell-warn font-medium"
                            )}
                          >
                            {formatAppliedPrice(item.unitPrice, item.situation)}
                          </TableCell>
                          <TableCell>
                            {formatAppliedPrice(item.totalPrice, item.situation)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "fechamento-situation",
                                critical && "fechamento-situation--critical",
                                warn && "fechamento-situation--warn"
                              )}
                            >
                              {closingSituationLabel(item.situation)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </DetailDrawer>
    </PageShell>
  );
}
