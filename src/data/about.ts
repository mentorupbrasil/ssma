/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export const ABOUT_HERO = {
  eyebrow: "Sobre a Unimetra",
  title: "Saúde ocupacional com cuidado, precisão e confiança",
  description:
    "A Unimetra apoia empresas em Medicina e Segurança do Trabalho, unindo atendimento presencial, organização documental e tecnologia para simplificar a rotina ocupacional.",
  primaryCta: "Falar com um especialista",
  secondaryCta: "Conhecer nossos serviços",
  /** Imagem futura do hero — null até aprovação. Caminho em /public. */
  image: null as string | null,
  imageAlt: "Unimetra — Medicina e Segurança do Trabalho em Imperatriz",
} as const;

export const ABOUT_HERO_STRIP = [
  "Medicina do Trabalho",
  "Segurança do Trabalho",
  "Imperatriz — MA",
] as const;

/* ------------------------------------------------------------------ */
/* Destaques (faixa de credibilidade)                                  */
/* ------------------------------------------------------------------ */
/*
 * Métricas de credibilidade da Unimetra.
 * TODO: substituir "+ de XXX" pelo número real de atendimentos realizados.
 */
export const ABOUT_HIGHLIGHTS = [
  {
    value: "Desde 2017",
    label: "Ano de fundação",
  },
  {
    value: "9 anos",
    label: "de mercado",
  },
  {
    value: "+ de XXX",
    label: "Atendimentos realizados",
  },
  {
    value: "Imperatriz — MA",
    label: "Atendimento presencial",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Nossa história                                                      */
/* ------------------------------------------------------------------ */

export const ABOUT_HISTORY = {
  eyebrow: "Nossa história",
  title: "Nossa trajetória é construída ao lado das empresas",
  paragraphs: [
    "Com atuação em Imperatriz, a Unimetra construiu sua trajetória oferecendo soluções em Medicina e Segurança do Trabalho para empresas de diferentes portes e segmentos. Desde sua comunicação institucional, a clínica mantém o compromisso com um atendimento personalizado, organizado e atento às necessidades de empresas, gestores e profissionais de RH.",
    "Ao longo de sua atuação, a Unimetra passou a unir atendimento presencial, suporte técnico e tecnologia para facilitar exames ocupacionais, documentos, encaminhamentos e rotinas de saúde e segurança do trabalho.",
  ],
  highlightQuote:
    "Mais do que realizar exames, ajudamos empresas a organizar o cuidado com seus colaboradores.",
  highlights: [
    "Atuação em Imperatriz — MA",
    "Atendimento a empresas de diferentes portes",
    "Suporte presencial e digital",
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Nossa atuação — bento                                               */
/* ------------------------------------------------------------------ */

export type AboutDeliverableItem = {
  title: string;
  text: string;
  layout: "featured" | "tall" | "medium" | "wide";
};

export const ABOUT_SCOPE = {
  eyebrow: "Nossa atuação",
  title: "Uma atuação integrada em saúde e segurança do trabalho",
  description:
    "Quatro frentes que conectam clínica, documentação e suporte às empresas em um fluxo mais claro.",
} as const;

export const ABOUT_DELIVERABLES: AboutDeliverableItem[] = [
  {
    layout: "featured",
    title: "Medicina do Trabalho",
    text: "Exames clínicos ocupacionais, ASO e programas médicos para acompanhar a saúde dos colaboradores com rigor técnico e clareza para a empresa.",
  },
  {
    layout: "tall",
    title: "Segurança do Trabalho",
    text: "Laudos, programas e suporte técnico para a gestão dos riscos ocupacionais e das obrigações legais de SST.",
  },
  {
    layout: "medium",
    title: "Documentação ocupacional",
    text: "ASO, PCMSO, PGR, LTCAT, PPP e eventos de SST organizados com atenção à conformidade e à rotina do RH.",
  },
  {
    layout: "wide",
    title: "Portal e suporte ao RH",
    text: "Encaminhamentos digitais, acompanhamento de status e centralização documental para facilitar o dia a dia das empresas.",
  },
];

/* ------------------------------------------------------------------ */
/* Nossa estrutura — galeria                                           */
/* ------------------------------------------------------------------ */

export type AboutGalleryFrame = {
  title: string;
  description: string;
  alt: string;
  image: string | null;
  variant: "primary" | "secondary-a" | "secondary-b";
};

export const ABOUT_STRUCTURE = {
  eyebrow: "Nossa estrutura",
  title: "Estrutura pensada para atender com conforto, qualidade e segurança",
  description:
    "Ambiente presencial, processos organizados e suporte digital em uma experiência pensada para empresas e colaboradores.",
  editorial: {
    title: "Organização presencial e digital",
    description:
      "Atendimento na clínica aliado a ferramentas digitais que facilitam encaminhamentos, status e consulta de documentos.",
  },
} as const;

export const ABOUT_STRUCTURE_GALLERY: AboutGalleryFrame[] = [
  {
    variant: "primary",
    title: "Conforto no atendimento",
    description:
      "Ambiente preparado para receber colaboradores e empresas com organização, privacidade e fluidez no atendimento clínico.",
    alt: "Conforto no atendimento — Unimetra",
    image: null,
  },
  {
    variant: "secondary-a",
    title: "Qualidade e organização",
    description:
      "Rotinas definidas para exames, documentos e encaminhamentos, com atenção à clareza em cada etapa.",
    alt: "Qualidade e organização — Unimetra",
    image: null,
  },
  {
    variant: "secondary-b",
    title: "Segurança e responsabilidade",
    description:
      "Cuidado com informações sensíveis, controle documental e postura responsável no tratamento de dados ocupacionais.",
    alt: "Segurança e responsabilidade — Unimetra",
    image: null,
  },
];

/* ------------------------------------------------------------------ */
/* Nossa equipe                                                        */
/* ------------------------------------------------------------------ */

export type AboutTeamMember = {
  name: string | null;
  role: string;
  description: string;
  photo: string | null;
  registration: string | null;
  variant: "medicina" | "examinador" | "sst" | "rh";
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
    variant: "medicina",
  },
  {
    name: null,
    role: "Médico Examinador",
    description:
      "Realiza exames clínicos ocupacionais e emite ASO com atenção à conformidade legal e à comunicação clara com gestores e colaboradores.",
    photo: null,
    registration: null,
    variant: "examinador",
  },
  {
    name: null,
    role: "Segurança do Trabalho",
    description:
      "Apoia empresas na documentação técnica, laudos e orientações de SST, contribuindo para ambientes mais seguros e organizados.",
    photo: null,
    registration: null,
    variant: "sst",
  },
  {
    name: null,
    role: "Atendimento e suporte ao RH",
    description:
      "Acompanha encaminhamentos, prazos e demandas das empresas, facilitando a rotina de quem gerencia a saúde ocupacional.",
    photo: null,
    registration: null,
    variant: "rh",
  },
];

/* ------------------------------------------------------------------ */
/* Como trabalhamos                                                    */
/* ------------------------------------------------------------------ */

export const ABOUT_WORKFLOW = {
  eyebrow: "Nosso processo",
  title: "Uma jornada organizada do primeiro contato à entrega",
  description:
    "Um fluxo claro do entendimento da empresa até a entrega documental, com suporte em cada etapa.",
} as const;

export const ABOUT_WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Entendimento da empresa",
    text: "Mapeamos porte, riscos, prazos admissionais e demandas legais para orientar o fluxo ocupacional de forma adequada.",
  },
  {
    step: 2,
    title: "Organização de exames e documentos",
    text: "Estruturamos ASOs, programas, laudos e exames complementares conforme a rotina da empresa e a legislação aplicável.",
  },
  {
    step: 3,
    title: "Encaminhamento e acompanhamento",
    text: "Encaminhamentos digitais, status claros e comunicação objetiva para reduzir retrabalho e atrasos na operação.",
  },
  {
    step: 4,
    title: "Entrega documental e suporte",
    text: "Entrega organizada de documentos e suporte contínuo às empresas na gestão da saúde ocupacional.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Confiança — três pilares                                            */
/* ------------------------------------------------------------------ */

export const ABOUT_TRUST = {
  eyebrow: "Confiança e responsabilidade",
  title: "Confiança construída com organização e responsabilidade",
  description:
    "Informações ocupacionais exigem cuidado, controle e responsabilidade. A Unimetra estrutura seus processos para apoiar empresas com seriedade e clareza.",
} as const;

export const ABOUT_TRUST_PILLARS = [
  {
    title: "Responsabilidade técnica",
    text: "Profissionais habilitados, atendimento empresarial e conformidade em Saúde e Segurança do Trabalho em cada etapa do fluxo ocupacional.",
  },
  {
    title: "Organização das informações",
    text: "Documentação ocupacional tratada com método, controle e responsabilidade com informações sensíveis dos colaboradores e das empresas.",
  },
  {
    title: "Apoio contínuo às empresas",
    text: "Suporte próximo ao RH e aos gestores, com comunicação objetiva e acompanhamento das demandas ao longo da rotina.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Propósito, missão e visão                                           */
/* ------------------------------------------------------------------ */

export const ABOUT_VALUES_SECTION = {
  eyebrow: "O que nos orienta",
  title: "Princípios que sustentam cada atendimento",
  description: "Diretrizes que sustentam a forma de atender, organizar processos e apoiar empresas.",
} as const;

export const ABOUT_VALUES = [
  {
    label: "Propósito",
    text: "Ajudar empresas a proteger pessoas, reduzir riscos e manter suas obrigações ocupacionais organizadas com mais clareza, segurança e confiança.",
  },
  {
    label: "Missão",
    text: "Simplificar a gestão de Saúde e Segurança do Trabalho para empresas, unindo atendimento ocupacional, documentação e acompanhamento digital.",
  },
  {
    label: "Visão",
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
