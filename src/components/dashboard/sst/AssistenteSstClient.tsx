"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  FileCheck,
  FileText,
  Sparkles,
  Shield,
} from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";
import { PlatformPositioningBanner } from "@/components/dashboard/PlatformPositioningBanner";
import { QuickActionGrid } from "@/components/dashboard/QuickActionGrid";
import { InfoBanner } from "@/components/dashboard/InfoBanner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SST_DOCUMENT_TYPES, buildSstDocumentPreview } from "@/lib/sst-assistant";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; label: string };

export function AssistenteSstClient({ companies }: { companies: CompanyOption[] }) {
  const [docType, setDocType] = useState(SST_DOCUMENT_TYPES[0].id);
  const [companyId, setCompanyId] = useState<string>("none");
  const [cnpj, setCnpj] = useState("");
  const [cnae, setCnae] = useState("");
  const [riskGrade, setRiskGrade] = useState("");
  const [sectors, setSectors] = useState("");
  const [functions, setFunctions] = useState("");
  const [risks, setRisks] = useState("");
  const [controls, setControls] = useState("");
  const [exams, setExams] = useState("");
  const [responsible, setResponsible] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState("");

  const selectedType = useMemo(
    () => SST_DOCUMENT_TYPES.find((t) => t.id === docType) ?? SST_DOCUMENT_TYPES[0],
    [docType]
  );

  const aiEnabled = Boolean(process.env.NEXT_PUBLIC_OPENAI_ENABLED);

  function handleGenerate() {
    const company = companies.find((c) => c.id === companyId);
    setPreview(
      buildSstDocumentPreview({
        docType: selectedType,
        companyName: company?.label,
        cnpj,
        cnae,
        riskGrade,
        sectors,
        functions,
        risks,
        controls,
        exams,
        responsible,
        notes,
      })
    );
  }

  return (
    <PageShell>
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Assistente SST</h1>
          <p className="colaboradores-empresa-subtitle">
            Geração guiada de documentos ocupacionais com modelos estruturados — revisão profissional obrigatória.
          </p>
        </div>
      </header>

      <PlatformPositioningBanner compact />

      <InfoBanner title="Validação profissional" icon={Shield}>
        Documentos gerados devem ser revisados e validados por profissional habilitado.
        {aiEnabled
          ? " Modo assistente IA disponível quando configurado."
          : " Modo modelo local ativo — configure OPENAI_API_KEY para assistente IA."}
      </InfoBanner>

      <section>
        <h2 className="section-label">Modelos de documento</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SST_DOCUMENT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setDocType(type.id)}
              className={cn(
                "premium-card p-4 text-left transition",
                docType === type.id && "border-[var(--brand-green)]/35 ring-2 ring-[var(--brand-green)]/10"
              )}
            >
              <p className="text-sm font-bold text-[var(--brand-navy)]">{type.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--dash-text-muted)]">{type.description}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="dashboard-surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--brand-navy)]">
            <Sparkles className="h-5 w-5 text-[var(--brand-green)]" strokeWidth={2} />
            Formulário guiado
          </h2>
          <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
            Preencha os dados da empresa e do documento selecionado: {selectedType.label}
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <Label>Empresa</Label>
              <Select value={companyId} onValueChange={(v) => v && setCompanyId(v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecionar empresa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="sst-cnpj">CNPJ</Label>
                <Input id="sst-cnpj" className="mt-1.5" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sst-cnae">CNAE</Label>
                <Input id="sst-cnae" className="mt-1.5" value={cnae} onChange={(e) => setCnae(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="sst-sectors">Setores / áreas</Label>
              <Textarea id="sst-sectors" rows={2} className="mt-1.5" value={sectors} onChange={(e) => setSectors(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-functions">Funções / cargos</Label>
              <Textarea id="sst-functions" rows={2} className="mt-1.5" value={functions} onChange={(e) => setFunctions(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-risks">Riscos identificados</Label>
              <Textarea id="sst-risks" rows={3} className="mt-1.5" value={risks} onChange={(e) => setRisks(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-controls">Medidas de controle / EPIs</Label>
              <Textarea id="sst-controls" rows={3} className="mt-1.5" value={controls} onChange={(e) => setControls(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-exams">Exames vinculados / periodicidade</Label>
              <Textarea id="sst-exams" rows={2} className="mt-1.5" value={exams} onChange={(e) => setExams(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-responsible">Responsável técnico</Label>
              <Input id="sst-responsible" className="mt-1.5" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-notes">Observações</Label>
              <Textarea id="sst-notes" rows={2} className="mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button variant="brand" className="w-full" onClick={handleGenerate}>
              Gerar prévia estruturada
            </Button>
          </div>
        </div>

        <div className="dashboard-surface flex flex-col p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--brand-navy)]">
            <FileText className="h-5 w-5 text-[var(--brand-navy)]" strokeWidth={2} />
            Prévia do documento
          </h2>
          <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
            Estrutura gerada a partir do modelo — exporte após revisão técnica.
          </p>
          <pre className="mt-4 max-h-[min(640px,60vh)] flex-1 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)]/50 p-4 text-sm leading-relaxed text-[var(--brand-text)]">
            {preview || "Preencha os dados e gere a prévia estruturada com base no modelo selecionado."}
          </pre>
          {preview && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <CopyButton text={preview} label="Copiar texto" />
              <Button variant="outline" onClick={() => window.print()}>
                Imprimir / PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 className="section-label">Próximos passos</h2>
        <QuickActionGrid
          actions={[
            { href: "/dashboard/documentos?new=1", label: "Salvar em Documentos", description: "Anexar após revisão", icon: FileCheck },
            { href: "/dashboard/empresas", label: "Dados da empresa", description: "Conferir cadastro", icon: Building2 },
            { href: "/dashboard/tarefas", label: "Criar tarefa de revisão", description: "Encaminhar validação", icon: FileText },
          ]}
        />
      </section>
    </PageShell>
  );
}
