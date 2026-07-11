"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, FileSpreadsheet, Plus, Upload } from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";
import { PlatformPositioningBanner } from "@/components/dashboard/PlatformPositioningBanner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { getMetricMeta } from "@/lib/metric-cards";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import { MobileListCard } from "@/components/dashboard/MobileListCard";
import { ClosingPipeline } from "@/components/dashboard/closings/ClosingPipeline";
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
  createMonthlyClosing,
  updateMonthlyClosingStatus,
} from "@/actions/closings";
import {
  generateClosingFromImport,
  importProductionCsv,
} from "@/actions/production-import";
import { formatCurrency } from "@/lib/pricing";
import { toast } from "sonner";

type Closing = {
  id: string;
  referenceMonth: Date;
  status: string;
  totalAmount: number | null;
  importedCount: number;
  withoutPriceCount: number;
  divergenceCount: number;
  company: { tradeName: string | null; legalName: string } | null;
};

type ImportSummary = {
  id: string;
  referenceMonth: Date;
  fileName: string | null;
  status: string;
  totalRows: number;
  recognizedRows: number;
  withoutCompany: number;
  withoutPrice: number;
  divergences: number;
  createdAt: Date;
};

type Summary = {
  openClosings: number;
  monthImports: number;
  withoutPrice: number;
  divergences: number;
  totalPreview: number;
};

export function FechamentoClient({
  items,
  imports,
  summary,
}: {
  items: Closing[];
  imports: ImportSummary[];
  summary: Summary;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [manualOpen, setManualOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [referenceMonth, setReferenceMonth] = useState("");
  const [importMonth, setImportMonth] = useState("");
  const [selectedImport, setSelectedImport] = useState<ImportSummary | null>(null);
  const [selectedClosing, setSelectedClosing] = useState<Closing | null>(null);

  const pipelineStep =
    summary.divergences > 0 || summary.withoutPrice > 0
      ? "fix"
      : summary.openClosings > 0
        ? "close"
        : imports.length > 0
          ? "review"
          : "import";

  async function handleManualCreate() {
    const result = await createMonthlyClosing({ referenceMonth });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Fechamento criado.");
    setManualOpen(false);
    startTransition(() => router.refresh());
  }

  async function handleImportFile(file: File) {
    if (!importMonth) {
      toast.error("Selecione a competência da importação.");
      return;
    }
    const csvText = await file.text();
    const result = await importProductionCsv({
      referenceMonth: importMonth + "-01",
      fileName: file.name,
      csvText,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Importação concluída: ${result.stats.totalRows} registros.`);
    setImportOpen(false);
    startTransition(() => router.refresh());
  }

  async function handleGenerateClosing(importId: string) {
    const result = await generateClosingFromImport(importId, { createReceivable: true });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Fechamento gerado e conta a receber criada.");
    startTransition(() => router.refresh());
  }

  return (
    <PageShell width="wide">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Fechamento mensal</h1>
          <p className="colaboradores-empresa-subtitle">
            Importe a produção do sistema clínico, cruze com a tabela de preços e gere cobranças.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Button variant="brand" size="sm" className="rounded-lg" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar produção
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setManualOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Fechamento manual
          </Button>
        </div>
      </header>

      <PlatformPositioningBanner compact />

      <ClosingPipeline activeStep={pipelineStep} className="mb-2" />

      <section>
        <h2 className="section-label">Indicadores</h2>
        <MetricGrid>
          {(
            [
              {
                key: "open",
                label: "Fechamentos abertos",
                value: summary.openClosings,
              },
              {
                key: "imports",
                label: "Importações no mês",
                value: summary.monthImports,
              },
              {
                key: "without_price",
                label: "Itens sem preço",
                value: summary.withoutPrice,
                badge: summary.withoutPrice > 0 ? "Revisar" : undefined,
              },
              {
                key: "divergences",
                label: "Divergências",
                value: summary.divergences,
                badge: summary.divergences > 0 ? "Corrigir" : undefined,
              },
              {
                key: "total_preview",
                label: "Total previsto",
                value: formatCurrency(summary.totalPreview),
              },
            ] satisfies Array<{
              key: string;
              label: string;
              value: string | number;
              badge?: string;
            }>
          ).map((item) => {
            const meta = getMetricMeta(`closing:${item.key}`);
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

      {imports.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-label">Importações recentes</h2>
          <div className="hidden md:block">
            <div className="colaboradores-empresa-table-wrap">
              <div className="colaboradores-empresa-table-scroll">
                <DataTable>
                  <Table className="colaboradores-empresa-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Competência</TableHead>
                        <TableHead>Arquivo</TableHead>
                        <TableHead>Registros</TableHead>
                        <TableHead>Prontos</TableHead>
                        <TableHead>Pendências</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imports.map((imp) => (
                        <TableRow key={imp.id} className="cursor-pointer" onClick={() => setSelectedImport(imp)}>
                          <TableCell>{format(imp.referenceMonth, "MMMM yyyy", { locale: ptBR })}</TableCell>
                          <TableCell>{imp.fileName ?? "Importação manual"}</TableCell>
                          <TableCell>{imp.totalRows}</TableCell>
                          <TableCell>{imp.recognizedRows}</TableCell>
                          <TableCell className="text-xs text-[var(--dash-text-muted)]">
                            {imp.withoutCompany > 0 && `${imp.withoutCompany} sem empresa · `}
                            {imp.withoutPrice > 0 && `${imp.withoutPrice} sem preço · `}
                            {imp.divergences > 0 && `${imp.divergences} divergências`}
                            {imp.withoutCompany === 0 && imp.withoutPrice === 0 && imp.divergences === 0 && "—"}
                          </TableCell>
                          <TableCell><StatusBadge status={imp.status} /></TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => handleGenerateClosing(imp.id)} disabled={pending}>
                              Gerar fechamento
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DataTable>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:hidden">
            {imports.map((imp) => (
              <MobileListCard
                key={imp.id}
                icon={Upload}
                title={imp.fileName ?? "Importação"}
                subtitle={format(imp.referenceMonth, "MMMM yyyy", { locale: ptBR })}
                meta={`${imp.recognizedRows}/${imp.totalRows} prontos`}
                badge={<StatusBadge status={imp.status} />}
                onClick={() => setSelectedImport(imp)}
              />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="Nenhum fechamento gerado"
          description="Importe a produção mensal exportada do sistema clínico para cruzar preços por empresa e gerar cobranças."
          action={{ label: "Importar produção", onClick: () => setImportOpen(true) }}
          secondaryAction={{ label: "Ver tabela de preços", href: "/dashboard/tabela-precos", variant: "outline" }}
        />
      ) : (
        <section className="space-y-3">
          <h2 className="section-label">Fechamentos</h2>
          <div className="hidden md:block">
            <div className="colaboradores-empresa-table-wrap">
              <div className="colaboradores-empresa-table-scroll">
                <DataTable>
                  <Table className="colaboradores-empresa-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Competência</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelectedClosing(item)}>
                          <TableCell>{format(item.referenceMonth, "MMMM yyyy", { locale: ptBR })}</TableCell>
                          <TableCell>{item.company?.tradeName ?? item.company?.legalName ?? "Consolidado"}</TableCell>
                          <TableCell>{item.importedCount || "—"}</TableCell>
                          <TableCell className="financial-value text-right">
                            {item.totalAmount != null ? formatCurrency(item.totalAmount) : "—"}
                          </TableCell>
                          <TableCell><StatusBadge status={item.status} /></TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {item.status !== "FECHADO" && item.status !== "FATURADO" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                onClick={() =>
                                  startTransition(async () => {
                                    await updateMonthlyClosingStatus(item.id, "FECHADO");
                                    toast.success("Fechamento concluído.");
                                    router.refresh();
                                  })
                                }
                              >
                                Fechar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DataTable>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:hidden">
            {items.map((item) => (
              <MobileListCard
                key={item.id}
                icon={Calculator}
                title={item.company?.tradeName ?? item.company?.legalName ?? "Consolidado"}
                subtitle={format(item.referenceMonth, "MMMM yyyy", { locale: ptBR })}
                meta={item.totalAmount != null ? formatCurrency(item.totalAmount) : "Total não informado"}
                badge={<StatusBadge status={item.status} />}
                onClick={() => setSelectedClosing(item)}
              />
            ))}
          </div>
        </section>
      )}

      <SystemModalShell
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar produção (CSV)"
        description="Colunas: empresa, CNPJ, colaborador, CPF, data, tipo_exame, protocolo, valor."
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
              disabled={pending}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Selecionar planilha
            </Button>
          </div>
        }
      >
        <SystemModalField label="Competência" required wide>
          <Input
            id="import-month"
            type="month"
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
            if (file) handleImportFile(file);
          }}
        />
      </SystemModalShell>

      <SystemModalShell
        open={manualOpen}
        onOpenChange={setManualOpen}
        title="Novo fechamento manual"
        description="Crie um fechamento sem importação de produção."
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
              onClick={() => setManualOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={handleManualCreate}
              disabled={pending || !referenceMonth}
            >
              Criar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Competência" required wide>
          <Input type="month" onChange={(e) => setReferenceMonth(e.target.value + "-01")} />
        </SystemModalField>
      </SystemModalShell>

      <DetailDrawer
        open={!!selectedImport}
        onOpenChange={(o) => !o && setSelectedImport(null)}
        title="Detalhe da importação"
        description={selectedImport?.fileName ?? undefined}
        size="lg"
        footer={
          selectedImport ? (
            <Button variant="brand" disabled={pending} onClick={() => handleGenerateClosing(selectedImport.id)}>
              Gerar fechamento
            </Button>
          ) : undefined
        }
      >
        {selectedImport && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Registros", selectedImport.totalRows],
              ["Reconhecidos", selectedImport.recognizedRows],
              ["Sem empresa", selectedImport.withoutCompany],
              ["Sem preço", selectedImport.withoutPrice],
              ["Divergências", selectedImport.divergences],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-[var(--dash-border)] bg-slate-50/60 p-3">
                <dt className="text-[0.625rem] font-bold uppercase text-[var(--dash-text-subtle)]">{label}</dt>
                <dd className="mt-1 text-lg font-bold text-[var(--brand-navy)]">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </DetailDrawer>

      <DetailDrawer
        open={!!selectedClosing}
        onOpenChange={(o) => !o && setSelectedClosing(null)}
        title="Fechamento mensal"
        description={selectedClosing ? format(selectedClosing.referenceMonth, "MMMM yyyy", { locale: ptBR }) : undefined}
        size="lg"
      >
        {selectedClosing && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-[var(--dash-text-muted)]">Empresa</dt>
              <dd>{selectedClosing.company?.tradeName ?? selectedClosing.company?.legalName ?? "Consolidado"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-[var(--dash-text-muted)]">Itens importados</dt>
              <dd>{selectedClosing.importedCount}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-[var(--dash-text-muted)]">Sem preço</dt>
              <dd>{selectedClosing.withoutPriceCount}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-[var(--dash-text-muted)]">Divergências</dt>
              <dd>{selectedClosing.divergenceCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--dash-text-muted)]">Total</dt>
              <dd className="financial-value">
                {selectedClosing.totalAmount != null ? formatCurrency(selectedClosing.totalAmount) : "—"}
              </dd>
            </div>
          </dl>
        )}
      </DetailDrawer>
    </PageShell>
  );
}
