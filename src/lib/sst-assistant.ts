export type SstDocumentType = {
  id: string;
  label: string;
  description: string;
  sections: string[];
};

export const SST_DOCUMENT_TYPES: SstDocumentType[] = [
  {
    id: "pgr",
    label: "PGR — Programa de Gerenciamento de Riscos",
    description: "Inventário e controle de riscos conforme NR-01.",
    sections: ["Identificação da empresa", "Inventário de riscos", "Medidas de controle", "Plano de ação", "Monitoramento"],
  },
  {
    id: "pcmso",
    label: "PCMSO — Programa de Controle Médico",
    description: "Programa médico conforme NR-07.",
    sections: ["Identificação", "Riscos e exames", "Cronograma", "Responsabilidades", "Anexos"],
  },
  {
    id: "ltcat",
    label: "LTCAT",
    description: "Laudo técnico das condições ambientais do trabalho.",
    sections: ["Caracterização", "Metodologia", "Agentes ambientais", "Conclusão"],
  },
  {
    id: "insalubridade",
    label: "Laudo de Insalubridade",
    description: "Avaliação de agentes insalubres e grau.",
    sections: ["Setor/função", "Agente", "Exposição", "Conclusão técnica"],
  },
  {
    id: "periculosidade",
    label: "Laudo de Periculosidade",
    description: "Avaliação de atividades/periculosidade.",
    sections: ["Atividade", "Agente de risco", "Conclusão"],
  },
  {
    id: "ordem_servico",
    label: "Ordem de Serviço",
    description: "Instruções de segurança por função.",
    sections: ["Função", "Riscos", "Procedimentos", "EPIs", "Treinamentos"],
  },
  {
    id: "apr",
    label: "APR — Análise Preliminar de Risco",
    description: "Análise antes de atividade não rotineira.",
    sections: ["Atividade", "Riscos", "Medidas", "Responsáveis"],
  },
  {
    id: "inventario_riscos",
    label: "Inventário de riscos",
    description: "Mapeamento por setor/função.",
    sections: ["Setor", "Função", "Perigo", "Risco", "Controle"],
  },
];

type PreviewInput = {
  docType: SstDocumentType;
  companyName?: string;
  cnpj?: string;
  cnae?: string;
  riskGrade?: string;
  sectors?: string;
  functions?: string;
  risks?: string;
  controls?: string;
  exams?: string;
  responsible?: string;
  notes?: string;
};

export function buildSstDocumentPreview(input: PreviewInput) {
  const lines: string[] = [
    input.docType.label.toUpperCase(),
    "═".repeat(48),
    "",
    `Empresa: ${input.companyName ?? "Não informado"}`,
    `CNPJ: ${input.cnpj?.trim() || "Não informado"}`,
    `CNAE: ${input.cnae?.trim() || "Não informado"}`,
    `Grau de risco: ${input.riskGrade?.trim() || "Não informado"}`,
    `Responsável técnico: ${input.responsible?.trim() || "Não informado"}`,
    "",
  ];

  for (const section of input.docType.sections) {
    lines.push(`## ${section}`);
    if (section.toLowerCase().includes("setor") || section.toLowerCase().includes("identificação")) {
      lines.push(input.sectors?.trim() || "Setores não informados.");
    } else if (section.toLowerCase().includes("função") || section.toLowerCase().includes("cargo")) {
      lines.push(input.functions?.trim() || "Funções não informadas.");
    } else if (section.toLowerCase().includes("risco") || section.toLowerCase().includes("perigo")) {
      lines.push(input.risks?.trim() || "Riscos não informados.");
    } else if (section.toLowerCase().includes("medida") || section.toLowerCase().includes("controle") || section.toLowerCase().includes("epi")) {
      lines.push(input.controls?.trim() || "Medidas de controle não informadas.");
    } else if (section.toLowerCase().includes("exame") || section.toLowerCase().includes("cronograma")) {
      lines.push(input.exams?.trim() || "Exames/periodicidade não informados.");
    } else {
      lines.push("Conteúdo a complementar conforme levantamento técnico in loco.");
    }
    lines.push("");
  }

  if (input.notes?.trim()) {
    lines.push("## Observações adicionais");
    lines.push(input.notes.trim());
    lines.push("");
  }

  lines.push("—");
  lines.push("Documento gerado pela plataforma Unimetra em modo modelo local.");
  lines.push("Revisão e validação por profissional habilitado são obrigatórias antes da entrega.");

  return lines.join("\n");
}
