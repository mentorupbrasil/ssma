import type { DocumentType, SstDocComplexity, SstDocKind, SstDocStage } from "@prisma/client";

export const SST_STAGE_LABELS: Record<SstDocStage, string> = {
  RASCUNHO: "Rascunho",
  EM_ELABORACAO: "Em elaboração",
  AGUARDANDO_REVISAO: "Aguardando revisão",
  APROVADO: "Aprovado",
  ARQUIVADO: "Arquivado",
};

export const SST_KIND_LABELS: Record<SstDocKind, string> = {
  PGR: "PGR",
  PCMSO: "PCMSO",
  LTCAT: "LTCAT",
  LAUDO_INSALUBRIDADE: "Laudo de insalubridade",
  LAUDO_PERICULOSIDADE: "Laudo de periculosidade",
  ORDEM_SERVICO: "Ordem de serviço",
  APR: "APR",
  INVENTARIO_RISCOS: "Inventário de riscos",
  RELATORIO_INSPECAO: "Relatório de inspeção",
  PLANO_ACAO: "Plano de ação",
  OUTROS: "Outros",
};

export type SstFormField = {
  key: string;
  label: string;
  hint?: string;
  multiline?: boolean;
  required?: boolean;
};

export type SstDocumentModel = {
  kind: SstDocKind;
  label: string;
  description: string;
  complexity: SstDocComplexity;
  fields: SstFormField[];
};

const TECNICO_BASE: SstFormField[] = [
  { key: "objetivo", label: "Objetivo do documento", multiline: true, required: true },
  { key: "escopo", label: "Escopo e limites", multiline: true, required: true },
  { key: "metodologia", label: "Metodologia aplicada", multiline: true, required: true },
];

export const SST_DOCUMENT_MODELS: SstDocumentModel[] = [
  {
    kind: "PGR",
    label: "PGR",
    description: "Programa de Gerenciamento de Riscos (NR-01). Exige inventário, controles e validação técnica.",
    complexity: "TECNICO",
    fields: [
      ...TECNICO_BASE,
      { key: "inventarioRiscos", label: "Inventário de riscos por setor/função", multiline: true, required: true },
      { key: "medidasControle", label: "Medidas de controle e EPIs", multiline: true, required: true },
      { key: "planoAcao", label: "Plano de ação", multiline: true, required: true },
      { key: "monitoramento", label: "Monitoramento e revisão", multiline: true },
      { key: "anexosTecnicos", label: "Referência a medições e laudos anexos", multiline: true },
    ],
  },
  {
    kind: "PCMSO",
    label: "PCMSO",
    description: "Programa de Controle Médico de Saúde Ocupacional (NR-07).",
    complexity: "TECNICO",
    fields: [
      ...TECNICO_BASE,
      { key: "riscosSaude", label: "Riscos à saúde (a partir do PGR)", multiline: true, required: true },
      { key: "quadroExames", label: "Quadro de exames por função/risco", multiline: true, required: true },
      { key: "periodicidade", label: "Periodicidade e critérios", multiline: true, required: true },
      { key: "medicoCoordenador", label: "Médico coordenador (CRM)", required: true },
      { key: "cronograma", label: "Cronograma de execução", multiline: true },
    ],
  },
  {
    kind: "LTCAT",
    label: "LTCAT",
    description: "Laudo Técnico das Condições Ambientais do Trabalho.",
    complexity: "TECNICO",
    fields: [
      ...TECNICO_BASE,
      { key: "caracterizacao", label: "Caracterização do ambiente e das atividades", multiline: true, required: true },
      { key: "agentes", label: "Agentes ambientais avaliados", multiline: true, required: true },
      { key: "resultadosMedicao", label: "Resultados de medições (somente dados anexados)", multiline: true, required: true },
      { key: "conclusao", label: "Conclusão técnica", multiline: true, required: true },
    ],
  },
  {
    kind: "LAUDO_INSALUBRIDADE",
    label: "Laudo de insalubridade",
    description: "Avaliação técnica de agentes insalubres e grau.",
    complexity: "TECNICO",
    fields: [
      ...TECNICO_BASE,
      { key: "setorFuncao", label: "Setor e função avaliados", multiline: true, required: true },
      { key: "agente", label: "Agente / NR-15", multiline: true, required: true },
      { key: "exposicao", label: "Condições de exposição (dados medidos)", multiline: true, required: true },
      { key: "conclusao", label: "Conclusão e enquadramento", multiline: true, required: true },
    ],
  },
  {
    kind: "LAUDO_PERICULOSIDADE",
    label: "Laudo de periculosidade",
    description: "Avaliação técnica de atividades/periculosidade (NR-16).",
    complexity: "TECNICO",
    fields: [
      ...TECNICO_BASE,
      { key: "atividade", label: "Atividade avaliada", multiline: true, required: true },
      { key: "agenteRisco", label: "Agente de risco", multiline: true, required: true },
      { key: "evidencias", label: "Evidências e anexos técnicos", multiline: true, required: true },
      { key: "conclusao", label: "Conclusão técnica", multiline: true, required: true },
    ],
  },
  {
    kind: "ORDEM_SERVICO",
    label: "Ordem de serviço",
    description: "Instruções de segurança por função — geração guiada simplificada.",
    complexity: "SIMPLIFICADO",
    fields: [
      { key: "funcao", label: "Função / cargo", required: true },
      { key: "riscos", label: "Riscos da função", multiline: true, required: true },
      { key: "procedimentos", label: "Procedimentos de segurança", multiline: true, required: true },
      { key: "epis", label: "EPIs obrigatórios", multiline: true, required: true },
      { key: "treinamentos", label: "Treinamentos necessários", multiline: true },
    ],
  },
  {
    kind: "APR",
    label: "APR",
    description: "Análise Preliminar de Risco para atividade específica.",
    complexity: "SIMPLIFICADO",
    fields: [
      { key: "atividade", label: "Atividade / serviço", required: true },
      { key: "local", label: "Local / setor", required: true },
      { key: "riscos", label: "Riscos identificados", multiline: true, required: true },
      { key: "medidas", label: "Medidas de controle", multiline: true, required: true },
      { key: "responsaveis", label: "Responsáveis pela execução", multiline: true },
    ],
  },
  {
    kind: "INVENTARIO_RISCOS",
    label: "Inventário de riscos",
    description: "Mapeamento estruturado por setor e função.",
    complexity: "TECNICO",
    fields: [
      { key: "escopo", label: "Escopo do inventário", multiline: true, required: true },
      { key: "matriz", label: "Matriz setor × função × perigo × risco × controle", multiline: true, required: true },
      { key: "priorizacao", label: "Priorização", multiline: true },
      { key: "pendencias", label: "Avaliações ainda pendentes", multiline: true },
    ],
  },
  {
    kind: "RELATORIO_INSPECAO",
    label: "Relatório de inspeção",
    description: "Registro de inspeção de segurança — fluxo simplificado.",
    complexity: "SIMPLIFICADO",
    fields: [
      { key: "local", label: "Local inspecionado", required: true },
      { key: "dataInspecao", label: "Data da inspeção", required: true },
      { key: "achados", label: "Achados / não conformidades", multiline: true, required: true },
      { key: "recomendacoes", label: "Recomendações", multiline: true, required: true },
      { key: "prazo", label: "Prazos sugeridos", multiline: true },
    ],
  },
  {
    kind: "PLANO_ACAO",
    label: "Plano de ação",
    description: "Ações corretivas/preventivas com responsáveis e prazos.",
    complexity: "SIMPLIFICADO",
    fields: [
      { key: "origem", label: "Origem (inspeção, PGR, auditoria…)", required: true },
      { key: "acoes", label: "Ações, responsáveis e prazos", multiline: true, required: true },
      { key: "indicadores", label: "Indicadores de conclusão", multiline: true },
    ],
  },
  {
    kind: "OUTROS",
    label: "Outros",
    description: "Documento SST diverso com seções livres e revisão obrigatória.",
    complexity: "SIMPLIFICADO",
    fields: [
      { key: "tituloSecao", label: "Assunto", required: true },
      { key: "conteudo", label: "Conteúdo", multiline: true, required: true },
      { key: "referencias", label: "Referências / anexos", multiline: true },
    ],
  },
];

export function getSstModel(kind: SstDocKind): SstDocumentModel {
  return SST_DOCUMENT_MODELS.find((m) => m.kind === kind) ?? SST_DOCUMENT_MODELS[SST_DOCUMENT_MODELS.length - 1];
}

export function isTechnicalSstKind(kind: SstDocKind) {
  return getSstModel(kind).complexity === "TECNICO";
}

export function mapSstKindToDocumentType(kind: SstDocKind): DocumentType {
  switch (kind) {
    case "PGR":
      return "PGR";
    case "PCMSO":
      return "PCMSO";
    case "LTCAT":
      return "LTCAT";
    case "LAUDO_INSALUBRIDADE":
      return "LAUDO_INSALUBRIDADE";
    case "LAUDO_PERICULOSIDADE":
      return "LAUDO_PERICULOSIDADE";
    default:
      return "DOCUMENTO_ADMINISTRATIVO";
  }
}

export type SstChecklistItem = {
  key: string;
  label: string;
  status: "ok" | "incomplete" | "missing" | "required_doc" | "pending_eval";
  detail: string;
};

export type CompanySstContext = {
  companyId: string;
  companyName: string;
  cnpj: string;
  segment: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  responsibleName: string | null;
  employeeCount: number;
  departments: string[];
  jobTitles: string[];
  employeesWithoutDept: number;
  employeesWithoutJob: number;
  priorDocuments: { id: string; title: string; type: string; status: string; updatedAt: string }[];
  linkedExamTitles: string[];
};

export function buildSstChecklist(
  ctx: CompanySstContext,
  kind: SstDocKind,
  hasTechnicalResponsible: boolean
): SstChecklistItem[] {
  const technical = isTechnicalSstKind(kind);
  const items: SstChecklistItem[] = [
    {
      key: "cadastro",
      label: "Cadastro da empresa",
      status: ctx.cnpj ? "ok" : "incomplete",
      detail: ctx.cnpj ? `${ctx.companyName} · CNPJ ${ctx.cnpj}` : "CNPJ ausente no cadastro.",
    },
    {
      key: "cnae",
      label: "CNAE / segmento",
      status: ctx.segment?.trim() ? "ok" : "incomplete",
      detail: ctx.segment?.trim()
        ? ctx.segment
        : "Segmento/CNAE não cadastrado na empresa. Complete em Empresas antes de concluir documentos técnicos.",
    },
    {
      key: "unidades",
      label: "Unidades",
      status: ctx.address || ctx.city ? "ok" : "incomplete",
      detail:
        ctx.address || ctx.city
          ? [ctx.address, ctx.city, ctx.state].filter(Boolean).join(" · ")
          : "Endereço/unidade não informado no cadastro (não há cadastro de múltiplas unidades).",
    },
    {
      key: "setores",
      label: "Setores",
      status: ctx.departments.length > 0 ? "ok" : "missing",
      detail:
        ctx.departments.length > 0
          ? `${ctx.departments.length} setor(es) a partir dos colaboradores: ${ctx.departments.slice(0, 8).join(", ")}`
          : "Setores não cadastrados (nenhum departamento nos colaboradores).",
    },
    {
      key: "funcoes",
      label: "Funções",
      status: ctx.jobTitles.length > 0 ? "ok" : "missing",
      detail:
        ctx.jobTitles.length > 0
          ? `${ctx.jobTitles.length} função(ões): ${ctx.jobTitles.slice(0, 8).join(", ")}`
          : "Funções não cadastradas (nenhum cargo nos colaboradores).",
    },
    {
      key: "colaboradores",
      label: "Colaboradores",
      status: ctx.employeeCount > 0 ? "ok" : "incomplete",
      detail:
        ctx.employeeCount > 0
          ? `${ctx.employeeCount} colaborador(es)${
              ctx.employeesWithoutDept || ctx.employeesWithoutJob
                ? ` · ${ctx.employeesWithoutDept} sem setor, ${ctx.employeesWithoutJob} sem função`
                : ""
            }`
          : "Nenhum colaborador cadastrado para a empresa.",
    },
    {
      key: "riscos",
      label: "Riscos cadastrados",
      status: technical ? "pending_eval" : "incomplete",
      detail:
        "Não há inventário de riscos persistido no sistema. Informe apenas riscos já avaliados; não invente exposições.",
    },
    {
      key: "exames",
      label: "Exames vinculados",
      status: ctx.linkedExamTitles.length > 0 ? "ok" : technical ? "incomplete" : "incomplete",
      detail:
        ctx.linkedExamTitles.length > 0
          ? ctx.linkedExamTitles.slice(0, 10).join(", ")
          : "Exames ocupacionais não vinculados à empresa (pacote/contrato ou documentos).",
    },
    {
      key: "docs_anteriores",
      label: "Documentos anteriores",
      status: ctx.priorDocuments.length > 0 ? "ok" : "required_doc",
      detail:
        ctx.priorDocuments.length > 0
          ? `${ctx.priorDocuments.length} documento(s) SST/empresa disponíveis para referência.`
          : "Nenhum documento anterior encontrado para importar como base.",
    },
    {
      key: "responsavel",
      label: "Responsável técnico",
      status: hasTechnicalResponsible ? "ok" : technical ? "missing" : "incomplete",
      detail: hasTechnicalResponsible
        ? "Responsável técnico definido."
        : technical
          ? "Responsável técnico não definido — obrigatório para documentos técnicos."
          : "Recomenda-se definir responsável técnico antes da finalização.",
    },
  ];

  if (technical) {
    items.push({
      key: "avaliacao_ambiental",
      label: "Avaliação ambiental",
      status: "pending_eval",
      detail: "Avaliação ambiental / medições devem ser anexadas. Sem anexo, a conclusão técnica permanece pendente.",
    });
  }

  if (kind === "PCMSO") {
    items.push({
      key: "funcoes_sem_risco",
      label: "Funções sem riscos vinculados",
      status: "pending_eval",
      detail: "Sem matriz risco×função no sistema. Cruzamento deve ser preenchido manualmente com base em PGR/avaliações.",
    });
  }

  return items;
}

export type SstContentMap = Record<string, string>;

export function parseSstJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Gera texto assistido somente com dados preenchidos — nunca inventa. */
export function buildAssistedSstText(input: {
  kind: SstDocKind;
  companyName: string;
  cnpj?: string;
  segment?: string | null;
  responsibleName?: string | null;
  content: SstContentMap;
  checklist?: SstChecklistItem[];
  version?: number;
}) {
  const model = getSstModel(input.kind);
  const lines: string[] = [
    model.label.toUpperCase(),
    "═".repeat(48),
    "",
    `Empresa: ${input.companyName}`,
    `CNPJ: ${input.cnpj?.trim() || "PENDÊNCIA: não informado no cadastro"}`,
    `Segmento/CNAE: ${input.segment?.trim() || "PENDÊNCIA: não cadastrado"}`,
    `Responsável técnico: ${input.responsibleName?.trim() || "PENDÊNCIA: não definido"}`,
    `Versão do rascunho: ${input.version ?? 1}`,
    "",
  ];

  for (const field of model.fields) {
    lines.push(`## ${field.label}`);
    const value = input.content[field.key]?.trim();
    if (value) {
      lines.push(value);
    } else if (field.required) {
      lines.push("PENDÊNCIA: campo obrigatório sem preenchimento. Não gerar conclusão automática.");
    } else {
      lines.push("— (não preenchido)");
    }
    lines.push("");
  }

  const incomplete = (input.checklist ?? []).filter((c) => c.status !== "ok");
  if (incomplete.length > 0) {
    lines.push("## Pendências de dados");
    for (const item of incomplete) {
      lines.push(`- [${item.label}] ${item.detail}`);
    }
    lines.push("");
  }

  lines.push("—");
  lines.push("Rascunho estruturado a partir de dados cadastrados e seções preenchidas.");
  lines.push("A plataforma não inventa riscos, medições, conclusões ou enquadramentos.");
  lines.push("Revisão e aprovação de profissional habilitado são obrigatórias antes da finalização.");

  return lines.join("\n");
}

export function emptyContentForKind(kind: SstDocKind): SstContentMap {
  const content: SstContentMap = {};
  for (const field of getSstModel(kind).fields) {
    content[field.key] = "";
  }
  return content;
}

export function defaultSstTitle(kind: SstDocKind, companyName: string) {
  return `${SST_KIND_LABELS[kind]} — ${companyName}`;
}

export function listTabStages(tab: string): SstDocStage[] | null {
  if (tab === "elaboracao") return ["RASCUNHO", "EM_ELABORACAO"];
  if (tab === "revisao") return ["AGUARDANDO_REVISAO"];
  if (tab === "aprovados") return ["APROVADO"];
  return null;
}
