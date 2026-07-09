import {
  FileText,
  Shield,
  ClipboardList,
  Stethoscope,
  Database,
  Smartphone,
  Users,
  Clock,
  Building2,
  FlaskConical,
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

export const EMPRESAS_COMPLIANCE_DOCS: ComplianceDoc[] = [
  {
    sigla: "PCMSO",
    name: "Programa de Controle Médico",
    description:
      "Programa obrigatório para monitorar a saúde ocupacional dos colaboradores conforme a NR-7.",
    icon: Stethoscope,
  },
  {
    sigla: "ASO",
    name: "Atestado de Saúde Ocupacional",
    description:
      "Documento emitido nos exames admissionais, periódicos, demissionais, retorno ao trabalho e mudança de função.",
    icon: ClipboardList,
  },
  {
    sigla: "PGR",
    name: "Programa de Gerenciamento de Riscos",
    description:
      "Base da gestão de riscos ocupacionais, com identificação e controle dos riscos no ambiente de trabalho.",
    icon: Shield,
  },
  {
    sigla: "LTCAT",
    name: "Laudo Técnico das Condições Ambientais",
    description:
      "Documento essencial para caracterização de exposição, PPP e fins previdenciários.",
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
    description:
      "Avaliação clínica antes do início das atividades, conforme NR-7 e PCMSO da empresa.",
    badge: "Obrigatório",
    highlight: true,
  },
  {
    type: "PERIODICO",
    label: "Periódico",
    description:
      "Acompanhamento periódico da saúde do colaborador conforme riscos, função e PCMSO.",
    badge: "Obrigatório",
    highlight: false,
  },
  {
    type: "DEMISSIONAL",
    label: "Demissional",
    description: "Exame clínico no encerramento do vínculo empregatício, com emissão do ASO.",
    badge: "Obrigatório",
    highlight: false,
  },
  {
    type: "RETORNO_TRABALHO",
    label: "Retorno ao trabalho",
    description:
      "Avaliação após afastamento por doença, acidente ou licença, com emissão do ASO de retorno.",
    badge: "Obrigatório",
    highlight: false,
  },
  {
    type: "MUDANCA_FUNCAO",
    label: "Mudança de função",
    description:
      "Avaliação quando há alteração de função, setor, riscos ou atividades do colaborador.",
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

export const TRUST_PILLARS: {
  title: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Conformidade legal",
    desc: "Atendimento alinhado às NRs e exigências do eSocial.",
    icon: Shield,
  },
  {
    title: "Portal empresarial",
    desc: "Encaminhamento e acompanhamento 100% digital.",
    icon: Smartphone,
  },
  {
    title: "Equipe especializada",
    desc: "Profissionais habilitados em medicina e segurança do trabalho.",
    icon: Users,
  },
  {
    title: "Atendimento ágil",
    desc: "Fluxo organizado para o RH com prazos claros.",
    icon: Clock,
  },
];

export const MARKET_DIFFERENTIALS: {
  title: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Atendimento ágil",
    desc: "Fluxo organizado para reduzir filas, atrasos e retrabalho do RH.",
    icon: Clock,
  },
  {
    title: "Equipe especializada",
    desc: "Médicos e técnicos com atuação focada em Medicina e Segurança do Trabalho.",
    icon: Users,
  },
  {
    title: "Estrutura completa",
    desc: "Atendimento, exames e documentos ocupacionais em um fluxo mais integrado.",
    icon: Building2,
  },
  {
    title: "Laboratório integrado",
    desc: "Mais praticidade para realizar exames e centralizar resultados.",
    icon: FlaskConical,
  },
  {
    title: "Portal empresarial",
    desc: "Encaminhamentos, status e histórico online para empresas clientes.",
    icon: Smartphone,
  },
  {
    title: "Conformidade legal",
    desc: "PCMSO, ASO, PGR, LTCAT, PPP e eSocial SST com mais organização.",
    icon: Shield,
  },
];
