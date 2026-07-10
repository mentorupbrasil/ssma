import {
  Building2,
  ClipboardCheck,
  FileCheck,
  Monitor,
  Shield,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

export const HOME_HERO_BADGES = [
  "ASO e exames ocupacionais",
  "PCMSO, PGR e LTCAT",
  "Portal empresarial",
  "Suporte para RH",
] as const;

export const HOME_CLIENT_WORDMARKS = [
  { primary: "ALFA", secondary: "Indústria", alt: "Alfa Indústria" },
  { primary: "GRUPO", secondary: "Nordeste", alt: "Grupo Nordeste" },
  { primary: "META", secondary: "Foods", alt: "Meta Foods" },
  { primary: "IMPERATRIZ", secondary: "Energia", alt: "Imperatriz Energia" },
  { primary: "RIO VERDE", secondary: "Agro", alt: "Rio Verde Agro" },
  { primary: "BETA", secondary: "Logística", alt: "Beta Logística" },
  { primary: "DELTA", secondary: "Construções", alt: "Delta Construções" },
] as const;

export type HomeWhyChooseItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const HOME_WHY_CHOOSE: HomeWhyChooseItem[] = [
  {
    title: "Atendimento empresarial",
    description: "Fluxo pensado para RH, gestores e empresas de diferentes portes.",
    icon: Building2,
  },
  {
    title: "Equipe habilitada",
    description: "Profissionais com atuação em Medicina e Segurança do Trabalho.",
    icon: Users,
  },
  {
    title: "Documentação organizada",
    description: "ASOs, laudos e programas com mais clareza para a rotina do RH.",
    icon: FileCheck,
  },
  {
    title: "Exames com fluxo claro",
    description: "Admissionais, periódicos e demissionais com encaminhamento orientado.",
    icon: Stethoscope,
  },
  {
    title: "Portal digital para RH",
    description: "Acompanhamento online de encaminhamentos, status e documentos.",
    icon: Smartphone,
  },
  {
    title: "Conformidade legal",
    description: "Apoio a PCMSO, PGR, LTCAT, eSocial SST e exigências ocupacionais.",
    icon: Shield,
  },
];

export const HOME_PROCESS_STEPS = [
  {
    title: "Solicitação",
    description: "A empresa entra em contato para orçamento ou orientação inicial.",
    icon: ClipboardCheck,
  },
  {
    title: "Análise da necessidade",
    description: "Entendemos porte, riscos, funções e documentos necessários.",
    icon: ShieldCheck,
  },
  {
    title: "Proposta e orientação",
    description: "Montamos um plano com exames, laudos e prazos alinhados ao PCMSO.",
    icon: FileCheck,
  },
  {
    title: "Encaminhamento e atendimento",
    description: "Colaboradores são encaminhados e atendidos com fluxo organizado.",
    icon: Stethoscope,
  },
  {
    title: "Documentos e acompanhamento",
    description: "ASOs, laudos e histórico disponíveis para consulta e organização.",
    icon: Monitor,
  },
] as const;

export const PORTAL_BENEFITS = [
  "Encaminhamento online com protocolo",
  "Acompanhamento por colaborador",
  "Histórico de exames e documentos",
  "Acesso exclusivo para empresa/RH",
  "Documentos disponíveis para download",
] as const;

export const COMPLIANCE_DOC_TAGS: Record<string, string> = {
  PCMSO: "Programa",
  ASO: "Obrigatório",
  PGR: "Programa",
  LTCAT: "Laudo",
  eSocial: "Evento digital",
};
