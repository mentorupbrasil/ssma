"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TEMPLATES: Record<string, string> = {
  pcmso: "Estrutura sugerida PCMSO:\n1. Identificação da empresa\n2. Caracterização dos riscos\n3. Plano de ações\n4. Cronograma de exames\n5. Responsabilidades",
  pgr: "Estrutura sugerida PGR:\n1. Inventário de riscos\n2. Avaliação e controle\n3. Plano de ação\n4. Monitoramento e revisão",
  epis: "Checklist EPI:\n- CA válido\n- Entrega registrada\n- Treinamento de uso\n- Substituir quando danificado\n- Higienização conforme fabricante",
  nr01: "NR-01 — Gerenciamento de riscos:\n- Gerenciamento de riscos ocupacionais (GRO)\n- Programa de Gerenciamento de Riscos (PGR)\n- Integração com PCMSO e demais programas",
};

export function AssistenteSstClient() {
  const [topic, setTopic] = useState("pcmso");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  function generate() {
    const base = TEMPLATES[topic] ?? "";
    const extra = question.trim()
      ? `\n\nOrientação para sua dúvida ("${question.trim()}"):\nRevise documentação vigente, envolva SESMT/médico do trabalho e registre no sistema documentos e evidências de treinamento.`
      : "";
    setAnswer(base + extra);
  }

  return (
    <div>
      <PageHeader
        title="Assistente SST"
        description="Modelos e orientações para documentos de Segurança e Saúde do Trabalho"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[var(--brand-green)]" />Gerar orientação</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pcmso">PCMSO</SelectItem>
                <SelectItem value="pgr">PGR</SelectItem>
                <SelectItem value="epis">EPIs</SelectItem>
                <SelectItem value="nr01">NR-01</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Descreva sua dúvida (opcional)" value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} />
            <Button onClick={generate}>Gerar orientação</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Resultado</CardTitle></CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-slate-700">{answer || "Selecione um tema e clique em Gerar orientação."}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
