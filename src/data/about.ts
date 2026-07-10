import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Building2,
  ClipboardCheck,
  Eye,
  FileCheck,
  Headphones,
  Heart,
  LayoutDashboard,
  MapPin,
  Monitor,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  UserRound,
  Users,
  Workflow,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export const ABOUT_HERO = {
  eyebrow: "Sobre a Unimetra",
  title: "Cuidado ocupacional, organização e confiança para empresas",
  description:
    "A Unimetra une Medicina do Trabalho, Segurança do Trabalho e tecnologia para apoiar empresas na gestão da saúde ocupacional, dos exames e da documentação de seus colaboradores.",
  primaryCta: "Falar com um especialista",
  secondaryCta: "Conhecer nossos serviços",
} as const;

/* ------------------------------------------------------------------ */
/* Faixa de pilares                                                    */
/* ------------------------------------------------------------------ */

export const ABOUT_PILLARS = [
  { icon: Stethoscope, label: "Medicina do Trabalho" },
  { icon: Shield, label: "Segurança do Trabalho" },
  { icon: Building2, label: "Atendimento empresarial" },
  { icon: Monitor, label: "Tecnologia para o RH" },
  { icon: MapPin, label: "Imperatriz — MA" },
] as const;

/* ------------------------------------------------------------------ */
/* Nossa história                                                      */
/* ------------------------------------------------------------------ */

export const ABOUT_HISTORY = {
  eyebrow: "Nossa história",
  title: "Nossa trajetória é construída ao lado das empresas",
  paragraphs: [
    "Com atuação em Imperatriz, a Unimetra construiu sua trajetória oferecendo soluções em Medicina e Segurança do Trabalho para empresas de diferentes portes e segmentos. Desde sua comunicação institucional, a clínica mantém o compromisso com um atendimento personalizado, organizado e atento às necessidades de empresas, gestores e profissionais de RH.",
    "Ao longo de sua atuação, a Unimetra passou a unir atendimento presencial, suporte técnico e tecnologia para facilitar exames ocupacionais, documentos, encaminhamentos e rotinas de saúde e segurança do trabalho. Essa evolução permite oferecer uma experiência mais clara para a empresa e mais organizada para quem acompanha a saúde ocupacional dos colaboradores.",
  ],
  quote:
    "Mais do que realizar exames e elaborar documentos, a Unimetra busca construir relações de confiança, contribuindo para ambientes de trabalho mais seguros, produtivos e equilibrados.",
} as const;

export const ABOUT_HISTORY_HIGHLIGHTS = [
  { icon: MapPin, label: "Atuação em Imperatriz — MA" },
  { icon: Building2, label: "Empresas de diferentes portes" },
  { icon: Users, label: "Equipe multidisciplinar" },
  { icon: Monitor, label: "Suporte presencial e digital" },
  { icon: ShieldCheck, label: "Foco em saúde e segurança do trabalho" },
] as const;

/* ------------------------------------------------------------------ */
/* Nossa atuação                                                       */
/* ------------------------------------------------------------------ */

export const ABOUT_SCOPE = {
  eyebrow: "Nossa atuação",
  title: "Uma atuação integrada em saúde e segurança do trabalho",
  description:
    "Quatro frentes de trabalho que conectam clínica, documentação e suporte às empresas em um fluxo mais claro.",
} as const;

export const ABOUT_DELIVERABLES = [
  {
    icon: Stethoscope,
    title: "Medicina do Trabalho",
    text: "Exames clínicos ocupacionais, ASO e programas médicos para acompanhar a saúde dos colaboradores com rigor técnico e clareza para a empresa.",
  },
  {
    icon: Shield,
    title: "Segurança do Trabalho",
    text: "Laudos, programas e suporte técnico para a gestão dos riscos ocupacionais e das obrigações legais de SST.",
  },
  {
    icon: FileCheck,
    title: "Documentação ocupacional",
    text: "ASO, PCMSO, PGR, LTCAT, PPP e eventos de SST organizados com atenção à conformidade e à rotina do RH.",
  },
  {
    icon: LayoutDashboard,
    title: "Suporte ao RH e portal empresarial",
    text: "Encaminhamentos digitais, acompanhamento de status e centralização documental para facilitar o dia a dia das empresas.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Nossa estrutura — image: null até haver foto aprovada               */
/* ------------------------------------------------------------------ */

export type AboutStructureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  image: string | null;
};

export const ABOUT_STRUCTURE = {
  eyebrow: "Nossa estrutura",
  title: "Estrutura pensada para atender com conforto, qualidade e segurança",
  description:
    "A Unimetra mantém uma estrutura voltada ao atendimento ocupacional de empresas e colaboradores, combinando ambiente presencial, organização dos processos e suporte digital.",
} as const;

export const ABOUT_STRUCTURE_ITEMS: AboutStructureItem[] = [
  {
    title: "Conforto no atendimento",
    description:
      "Ambiente preparado para receber colaboradores e empresas com organização, privacidade e fluidez no atendimento clínico.",
    icon: Armchair,
    image: null,
  },
  {
    title: "Qualidade nos processos",
    description:
      "Rotinas definidas para exames, documentos e encaminhamentos, com atenção à clareza em cada etapa do fluxo ocupacional.",
    icon: Sparkles,
    image: null,
  },
  {
    title: "Segurança e responsabilidade",
    description:
      "Cuidado com informações sensíveis, controle documental e postura responsável no tratamento de dados ocupacionais.",
    icon: ShieldCheck,
    image: null,
  },
  {
    title: "Organização presencial e digital",
    description:
      "Atendimento na clínica aliado a ferramentas digitais que facilitam encaminhamentos, status e consulta de documentos.",
    icon: Monitor,
    image: null,
  },
];

/* ------------------------------------------------------------------ */
/* Nossa equipe — preencher name, photo, registration quando houver    */
/* ------------------------------------------------------------------ */

export type AboutTeamMember = {
  /** Nome completo. Deixe null enquanto não houver autorização para publicar. */
  name: string | null;
  role: string;
  description: string;
  /** Caminho em /public ou URL. Deixe null para fallback visual institucional. */
  photo: string | null;
  /** CRM, COREN ou registro profissional. Só preencher com dado confirmado. */
  registration: string | null;
  icon: LucideIcon;
  /** Monograma exibido no avatar quando photo for null. */
  monogram: string;
};

export const ABOUT_TEAM = {
  eyebrow: "Nossa equipe",
  title: "Profissionais preparados para cuidar da saúde e da segurança no trabalho",
  description:
    "A atuação da Unimetra é apoiada por profissionais de diferentes áreas, preparados para oferecer atendimento clínico, suporte técnico e orientação às empresas.",
} as const;

export const ABOUT_TEAM_MEMBERS: AboutTeamMember[] = [
  {
    name: null,
    role: "Médico do Trabalho",
    description:
      "Responsável por conduzir a medicina ocupacional, programas médicos e acompanhamento clínico alinhado às necessidades das empresas.",
    photo: null,
    registration: null,
    icon: Stethoscope,
    monogram: "MT",
  },
  {
    name: null,
    role: "Médico Examinador",
    description:
      "Realiza exames clínicos ocupacionais e emite ASO com atenção à conformidade legal e à comunicação clara com gestores e colaboradores.",
    photo: null,
    registration: null,
    icon: UserRound,
    monogram: "ME",
  },
  {
    name: null,
    role: "Segurança do Trabalho",
    description:
      "Apoia empresas na documentação técnica, laudos e orientações de SST, contribuindo para ambientes mais seguros e organizados.",
    photo: null,
    registration: null,
    icon: Shield,
    monogram: "ST",
  },
  {
    name: null,
    role: "Atendimento e suporte ao RH",
    description:
      "Acompanha encaminhamentos, prazos e demandas das empresas, facilitando a rotina de quem gerencia a saúde ocupacional.",
    photo: null,
    registration: null,
    icon: Headphones,
    monogram: "RH",
  },
];

/* ------------------------------------------------------------------ */
/* Como trabalhamos                                                    */
/* ------------------------------------------------------------------ */

export const ABOUT_WORKFLOW = {
  eyebrow: "Como trabalhamos",
  title: "Como trabalhamos",
  description:
    "Um fluxo claro do entendimento da empresa até a entrega documental, com suporte em cada etapa.",
} as const;

export const ABOUT_WORKFLOW_STEPS = [
  {
    step: 1,
    icon: Building2,
    title: "Entendimento da empresa",
    text: "Mapeamos porte, riscos, prazos admissionais e demandas legais para orientar o fluxo ocupacional de forma adequada.",
  },
  {
    step: 2,
    icon: FileCheck,
    title: "Organização de exames e documentos",
    text: "Estruturamos ASOs, programas, laudos e exames complementares conforme a rotina da empresa e a legislação aplicável.",
  },
  {
    step: 3,
    icon: Workflow,
    title: "Encaminhamento e acompanhamento",
    text: "Encaminhamentos digitais, status claros e comunicação objetiva para reduzir retrabalho e atrasos na operação.",
  },
  {
    step: 4,
    icon: ClipboardCheck,
    title: "Entrega documental e suporte",
    text: "Entrega organizada de documentos e suporte contínuo às empresas na gestão da saúde ocupacional.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Confiança                                                           */
/* ------------------------------------------------------------------ */

export const ABOUT_TRUST = {
  eyebrow: "Confiança, responsabilidade e conformidade",
  title: "Confiança construída com organização e responsabilidade",
  description:
    "Informações ocupacionais exigem cuidado, controle e responsabilidade. Por isso, a Unimetra estrutura seus processos para apoiar empresas na gestão de exames, documentos e dados sensíveis.",
} as const;

export const ABOUT_TRUST_CHECKLIST = [
  "Atendimento empresarial",
  "Profissionais habilitados",
  "Organização documental",
  "Responsabilidade com informações sensíveis",
  "Conformidade em Saúde e Segurança do Trabalho",
  "Apoio contínuo às empresas",
] as const;

/* ------------------------------------------------------------------ */
/* Propósito, missão e visão                                           */
/* ------------------------------------------------------------------ */

export const ABOUT_VALUES_SECTION = {
  eyebrow: "Propósito, missão e visão",
  title: "Propósito, missão e visão",
  description: "Diretrizes que sustentam a forma de atender, organizar processos e apoiar empresas.",
} as const;

export const ABOUT_VALUES = [
  {
    icon: Heart,
    title: "Propósito",
    text: "Ajudar empresas a proteger pessoas, reduzir riscos e manter suas obrigações ocupacionais organizadas com mais clareza, segurança e confiança.",
  },
  {
    icon: Target,
    title: "Missão",
    text: "Simplificar a gestão de Saúde e Segurança do Trabalho para empresas, unindo atendimento ocupacional, documentação e acompanhamento digital.",
  },
  {
    icon: Eye,
    title: "Visão",
    text: "Ser referência regional em Medicina e Segurança do Trabalho pela qualidade do atendimento, organização dos processos e uso responsável da tecnologia.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* CTA final                                                           */
/* ------------------------------------------------------------------ */

export const ABOUT_FINAL_CTA = {
  title: "Conte com a Unimetra na saúde ocupacional da sua empresa",
  description:
    "Fale com nossa equipe para organizar exames, documentos, encaminhamentos e rotinas de Saúde e Segurança do Trabalho.",
  primaryCta: "Solicitar orçamento",
  secondaryCta: "Falar no WhatsApp",
} as const;
