export type NewsSlideAccent = "emerald" | "amber" | "campaign";

export type NewsSlideVisualType = "toxicologico" | "concurso" | "julho";

export type NewsSlideAction = {
  label: string;
  href: string;
};

export type NewsSlide = {
  id: string;
  tabLabel: string;
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description: string;
  benefits: [string, string];
  action: NewsSlideAction;
  accent: NewsSlideAccent;
  visualType: NewsSlideVisualType;
};

export const HOME_HERO_NEWS_SLIDES: NewsSlide[] = [
  {
    id: "toxicologico",
    tabLabel: "Exame Toxicológico",
    eyebrow: "Serviço em destaque",
    title: "Exame",
    titleAccent: "Toxicológico",
    description:
      "Coleta orientada e laudo para CNH, funções regulamentadas e exigências ocupacionais.",
    benefits: ["Atendimento ágil", "Resultado confiável"],
    action: {
      label: "Agendar exame",
      href: "/encaminhamento-online",
    },
    accent: "emerald",
    visualType: "toxicologico",
  },
  {
    id: "concurso",
    tabLabel: "Concursos",
    eyebrow: "Solução em destaque",
    title: "Pacotes de exames para concursos",
    description:
      "Realize os exames do edital com orientação de preparo e atendimento organizado.",
    benefits: ["Pacotes conforme o edital", "Suporte durante o processo"],
    action: {
      label: "Solicitar orçamento",
      href: "/contato?tipo=orcamento",
    },
    accent: "amber",
    visualType: "concurso",
  },
  {
    id: "julho",
    tabLabel: "Julho",
    eyebrow: "Campanhas do mês",
    title: "Julho: prevenção em foco",
    description:
      "Informação e conscientização para incentivar o cuidado, a prevenção e o diagnóstico precoce.",
    benefits: ["Orientação em saúde", "Conscientização nas empresas"],
    action: {
      // TODO: criar página dedicada de campanhas preventivas quando disponível.
      label: "Conhecer ações preventivas",
      href: "/atualizacoes",
    },
    accent: "campaign",
    visualType: "julho",
  },
];
