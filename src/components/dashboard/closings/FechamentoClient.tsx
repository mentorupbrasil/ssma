"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, FileSpreadsheet, Plus, Upload } from "lucide-react";
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

  async function handleManualCreate() {
    const result = await createMonthlyClosing({ referenceMonth });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Fechamento criado");
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
    toast.success(`Importação concluída: ${result.stats.totalRows} registros`);
    setImportOpen(false);
    startTransition(() => router.refresh());
  }

  async function handleGenerateClosing(importId: string) {
    const result = await generateClosingFromImport(importId, { createReceivable: true });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Fechamento gerado e conta a receber criada");
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fechamento mensal"
        description="Importe a produção do sistema clínico, cruze com a tabela de preços e gere cobranças"
        actions={
          <div className="flex flex-wrap gap-2">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger render={<Button variant="brand"><Upload className="mr-2 h-4 w-4" />Importar produção</Button>} />
              <DialogContent>
                <DialogHeader><DialogTitle>Importar produção (CSV/Excel exportado)</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Colunas esperadas: empresa, CNPJ, colaborador, CPF, data, tipo_exame, protocolo, valor.
                  </p>
                  <div>
                    <Label htmlFor="import-month">Competência</Label>
                    <Input id="import-month" type="month" className="mt-1" onChange={(e) => setImportMonth(e.target.value)} />
                  </div>
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
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={pending}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Selecionar planilha
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
              <DialogTrigger render={<Button variant="outline"><Plus className="mr-2 h-4 w-4" />Fechamento manual</Button>} />
              <DialogContent>
                <DialogHeader><DialogTitle>Novo fechamento manual</DialogTitle></DialogHeader>
                <Input type="month" onChange={(e) => setReferenceMonth(e.target.value + "-01")} />
                <Button className="mt-3 w-full" onClick={handleManualCreate} disabled={pending || !referenceMonth}>
                  Criar
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <PlatformPositioningBanner compact />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Fechamentos abertos" value={summary.openClosings} icon={Calculator} />
        <StatCard title="Importações no mês" value={summary.monthImports} icon={Upload} />
        <StatCard title="Itens sem preço" value={summary.withoutPrice} icon={Calculator} />
        <StatCard title="Divergências" value={summary.divergences} icon={Calculator} />
        <StatCard title="Total previsto" value={formatCurrency(summary.totalPreview)} icon={Calculator} />
      </div>

      {imports.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Importações recentes</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
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
                  <TableRow key={imp.id}>
                    <TableCell>{format(imp.referenceMonth, "MMMM yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{imp.fileName ?? "Importação manual"}</TableCell>
                    <TableCell>{imp.totalRows}</TableCell>
                    <TableCell>{imp.recognizedRows}</TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {imp.withoutCompany > 0 && `${imp.withoutCompany} sem empresa · `}
                      {imp.withoutPrice > 0 && `${imp.withoutPrice} sem preço · `}
                      {imp.divergences > 0 && `${imp.divergences} divergências`}
                      {imp.withoutCompany === 0 && imp.withoutPrice === 0 && imp.divergences === 0 && "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={imp.status} /></TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleGenerateClosing(imp.id)} disabled={pending}>
                        Gerar fechamento
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="Nenhum fechamento gerado"
          description="Importe a produção mensal exportada do sistema clínico atual para cruzar preços por empresa e gerar cobranças."
          action={{ label: "Importar produção", onClick: () => setImportOpen(true) }}
          secondaryAction={{ label: "Ver tabela de preços", href: "/dashboard/tabela-precos", variant: "outline" }}
        />
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Fechamentos</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(item.referenceMonth, "MMMM yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{item.company?.tradeName ?? item.company?.legalName ?? "Consolidado"}</TableCell>
                    <TableCell>{item.importedCount || "—"}</TableCell>
                    <TableCell className="font-semibold">
                      {item.totalAmount != null ? formatCurrency(item.totalAmount) : "Não informado"}
                    </TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell>
                      {item.status !== "FECHADO" && item.status !== "FATURADO" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await updateMonthlyClosingStatus(item.id, "FECHADO");
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
          </div>
        </section>
      )}
    </div>
  );
}
