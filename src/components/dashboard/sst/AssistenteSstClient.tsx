"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  FileCheck,
  FileText,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PlatformPositioningBanner } from "@/components/dashboard/PlatformPositioningBanner";
import { QuickActionGrid } from "@/components/dashboard/QuickActionGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SST_DOCUMENT_TYPES, buildSstDocumentPreview } from "@/lib/sst-assistant";

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
    <div className="space-y-6">
      <PageHeader
        title="Assistente SST"
        description="Geração guiada de documentos técnicos com modelos locais — revisão profissional obrigatória"
      />

      <PlatformPositioningBanner compact />

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
        <strong>Aviso técnico:</strong> documentos gerados devem ser revisados e validados por profissional habilitado.
        {aiEnabled
          ? " Modo assistente IA disponível quando configurado."
          : " Modo modelo local ativo — configure OPENAI_API_KEY no futuro para assistente IA."}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-[var(--brand-green)]" />
              Dados do documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Tipo de documento</Label>
              <Select value={docType} onValueChange={(v) => v && setDocType(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SST_DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-slate-500">{selectedType.description}</p>
            </div>
            <div>
              <Label>Empresa</Label>
              <Select value={companyId} onValueChange={(v) => v && setCompanyId(v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar empresa" /></SelectTrigger>
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
                <input id="sst-cnpj" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sst-cnae">CNAE</Label>
                <input id="sst-cnae" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={cnae} onChange={(e) => setCnae(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="sst-sectors">Setores / áreas</Label>
              <Textarea id="sst-sectors" rows={2} value={sectors} onChange={(e) => setSectors(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-functions">Funções / cargos</Label>
              <Textarea id="sst-functions" rows={2} value={functions} onChange={(e) => setFunctions(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-risks">Riscos identificados</Label>
              <Textarea id="sst-risks" rows={3} value={risks} onChange={(e) => setRisks(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-controls">Medidas de controle / EPIs</Label>
              <Textarea id="sst-controls" rows={3} value={controls} onChange={(e) => setControls(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-exams">Exames vinculados / periodicidade</Label>
              <Textarea id="sst-exams" rows={2} value={exams} onChange={(e) => setExams(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-responsible">Responsável técnico</Label>
              <input id="sst-responsible" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sst-notes">Observações</Label>
              <Textarea id="sst-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button variant="brand" className="w-full" onClick={handleGenerate}>
              Gerar prévia estruturada
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-[var(--brand-navy)]" />
              Prévia do documento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              {preview || "Preencha os dados e gere a prévia estruturada com base no modelo selecionado."}
            </pre>
            {preview && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(preview)}>
                  Copiar texto
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  Imprimir / PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <QuickActionGrid
        actions={[
          { href: "/dashboard/documentos?new=1", label: "Salvar em Documentos", description: "Anexar após revisão", icon: FileCheck },
          { href: "/dashboard/empresas", label: "Dados da empresa", description: "Conferir cadastro", icon: Building2 },
          { href: "/dashboard/tarefas", label: "Criar tarefa de revisão", description: "Encaminhar validação", icon: FileText },
        ]}
      />
    </div>
  );
}
