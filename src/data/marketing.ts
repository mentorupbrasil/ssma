import {
  FileText,
  Shield,
  ClipboardList,
  Stethoscope,
  Database,
  type LucideIcon,
} from "lucide-react";

export type ComplianceDoc = {
  sigla: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

export const COMPLIANCE_DOCS: ComplianceDoc[] = [
  {
    sigla: "PCMSO",
    name: "Programa de Controle Médico",
    description: "Obrigatório para empresas com riscos ocupacionais conforme a NR-7.",
    icon: Stethoscope,
  },
  {
    sigla: "ASO",
    name: "Atestado de Saúde Ocupacional",
    description:
      "Admissional, periódico, demissional, retorno ao trabalho e mudança de função.",
    icon: ClipboardList,
  },
  {
    sigla: "PGR",
    name: "Programa de Gerenciamento de Riscos",
    description: "Identificação, avaliação e controle dos riscos no ambiente de trabalho.",
    icon: Shield,
  },
  {
    sigla: "LTCAT",
    name: "Laudo Técnico das Condições Ambientais do Trabalho",
    description: "Documento essencial para aposentadoria especial, PPP e enquadramentos.",
    icon: FileText,
  },
  {
    sigla: "eSocial",
    name: "Eventos de SST no eSocial",
    description: "Envio correto das informações ocupacionais exigidas pelo governo.",
    icon: Database,
  },
];

export const CLINICAL_EXAM_TYPES = [
  {
    type: "ADMISSIONAL",
    label: "Admissional",
    description: "Antes do início das atividades laborais.",
    badge: "Obrigatório",
    highlight: true,
  },
  {
    type: "PERIODICO",
    label: "Periódico",
    description: "Acompanhamento regular da saúde ocupacional.",
    badge: "Obrigatório",
    highlight: false,
  },
  {
    type: "DEMISSIONAL",
    label: "Demissional",
    description: "No desligamento do colaborador.",
    badge: "Obrigatório",
    highlight: false,
  },
  {
    type: "RETORNO_TRABALHO",
    label: "Retorno ao trabalho",
    description: "Após afastamento por doença ou acidente.",
    badge: "Obrigatório",
    highlight: false,
  },
  {
    type: "MUDANCA_FUNCAO",
    label: "Mudança de função",
    description: "Quando há alteração de riscos ou atividades.",
    badge: "Obrigatório",
    highlight: false,
  },
] as const;

export const EMPLOYEE_RANGES = [
  { value: "1-10", label: "1 a 10 colaboradores" },
  { value: "11-50", label: "11 a 50 colaboradores" },
  { value: "51-100", label: "51 a 100 colaboradores" },
  { value: "101-500", label: "101 a 500 colaboradores" },
  { value: "500+", label: "Mais de 500 colaboradores" },
] as const;

export const TRUST_PILLARS = [
  { title: "Conformidade legal", desc: "Atendimento alinhado às NRs e exigências do eSocial." },
  { title: "Portal empresarial", desc: "Encaminhamento e acompanhamento 100% digital." },
  { title: "Equipe especializada", desc: "Profissionais habilitados em medicina e segurança do trabalho." },
  { title: "Atendimento ágil", desc: "Fluxo organizado para o RH com prazos claros." },
] as const;
