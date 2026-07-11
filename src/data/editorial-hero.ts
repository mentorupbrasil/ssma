export const EDITORIAL_HERO_BADGES = [
  "Legislação e NRs",
  "Exames ocupacionais",
  "Dicas para RH",
  "eSocial e conformidade",
] as const;

/** @deprecated Use EDITORIAL_HERO_BADGES */
export const BLOG_HERO_BADGES = EDITORIAL_HERO_BADGES;

export type EditorialHeroLines = readonly [string, string];

export type EditorialHeroContent = {
  titleLines: EditorialHeroLines;
  descriptionLines: EditorialHeroLines;
  ctaLabel: string;
};

export const EDITORIAL_HERO_CONTENT = {
  sobre: {
    titleLines: ["Saúde ocupacional com", "cuidado, precisão e confiança"],
    descriptionLines: [
      "A Unimetra apoia empresas em Medicina e Segurança do Trabalho,",
      "unindo atendimento presencial, documentos e tecnologia.",
    ],
    ctaLabel: "Conhecer nossos serviços",
  },
  servicos: {
    titleLines: ["Soluções completas em", "Saúde e Segurança do Trabalho"],
    descriptionLines: [
      "Exames ocupacionais, programas, laudos e documentação",
      "para manter sua empresa em conformidade.",
    ],
    ctaLabel: "Falar com especialista",
  },
  exames: {
    titleLines: ["Exames e preparos", "ocupacionais"],
    descriptionLines: [
      "Consulte preparo, prazos e orientações para exames",
      "solicitados pela empresa ou avaliação médica.",
    ],
    ctaLabel: "Falar com especialista",
  },
  blog: {
    titleLines: ["Blog de Saúde e", "Segurança do Trabalho"],
    descriptionLines: [
      "Artigos, orientações e atualizações para empresas, gestores e equipes",
      "de RH manterem a rotina ocupacional organizada e em conformidade.",
    ],
    ctaLabel: "Falar com especialista",
  },
  encaminhamento: {
    titleLines: ["Encaminhamento rápido", "de colaborador"],
    descriptionLines: [
      "Envie as informações principais e nossa equipe",
      "confirma o atendimento pelo WhatsApp.",
    ],
    ctaLabel: "Preencher formulário",
  },
  contato: {
    titleLines: ["Entre em contato", "com a Unimetra"],
    descriptionLines: [
      "Nossa equipe comercial responde com agilidade.",
      "Para demandas urgentes, fale pelo WhatsApp.",
    ],
    ctaLabel: "Falar com especialista",
  },
} as const satisfies Record<string, EditorialHeroContent>;
