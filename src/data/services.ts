export type ServiceItem = {
  name: string;
  description: string;
  badge?: string;
  preparoSlug?: string;
  highlights?: string[];
  showDetailsLink?: boolean;
};

export type ServiceCategoryCta = {
  text: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export type ServiceCategory = {
  id: string;
  title: string;
  description?: string;
  contextLine?: string;
  cta?: ServiceCategoryCta;
  services: ServiceItem[];
};

export const SERVICES_HERO_BADGES = [
  "ASO",
  "PCMSO",
  "PGR",
  "LTCAT",
  "Exames complementares",
  "eSocial SST",
] as const;

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "medicina-ocupacional",
    title: "Medicina Ocupacional",
    description:
      "Atendimento clínico, exames ocupacionais e programas médicos para admissão, acompanhamento periódico e regularização da saúde dos colaboradores.",
    contextLine: "Do admissional ao periódico, com emissão de ASO e apoio ao PCMSO da empresa.",
    cta: {
      text: "Organize os exames ocupacionais da sua empresa com mais clareza.",
      primaryLabel: "Solicitar proposta",
      primaryHref: "/contato?tipo=orcamento&area=medicina-ocupacional",
    },
    services: [
      {
        name: "ASO Admissional",
        badge: "ASO",
        description:
          "Avaliação clínica antes do início das atividades, conforme a NR-7 e o PCMSO da empresa.",
        highlights: ["Aptidão para a função", "Conformidade na admissão"],
      },
      {
        name: "ASO Demissional",
        badge: "ASO",
        description:
          "Exame clínico no encerramento do vínculo empregatício, com emissão do ASO correspondente.",
        highlights: ["Encerramento documentado", "Registro no prontuário"],
      },
      {
        name: "ASO Periódico",
        badge: "ASO",
        description:
          "Acompanhamento periódico da saúde dos colaboradores conforme riscos, função e periodicidade definida no PCMSO.",
        highlights: ["Periodicidade por risco", "Acompanhamento contínuo"],
      },
      {
        name: "Mudança de Função",
        badge: "ASO",
        description:
          "Avaliação clínica quando há alteração de função, setor, riscos ou atividades do colaborador.",
        highlights: ["Nova função avaliada", "Riscos atualizados"],
      },
      {
        name: "Retorno ao Trabalho",
        badge: "ASO",
        description:
          "Avaliação após afastamento por doença, acidente ou licença prolongada, com emissão do ASO de retorno.",
        highlights: ["Retorno seguro", "Laudo de aptidão"],
      },
      {
        name: "Consulta Ocupacional",
        badge: "Clínica",
        description:
          "Consulta médica ocupacional para avaliação clínica do colaborador conforme função e riscos.",
        highlights: ["Avaliação clínica", "Orientação ocupacional"],
      },
      {
        name: "PCMSO",
        badge: "Programa",
        description:
          "Elaboração e acompanhamento do Programa de Controle Médico de Saúde Ocupacional conforme a NR-7.",
        highlights: ["Exames previstos no programa", "Apoio à gestão médica"],
        showDetailsLink: true,
      },
      {
        name: "PPP",
        badge: "Documento",
        description:
          "Emissão do Perfil Profissiográfico Previdenciário com base no histórico ocupacional do colaborador.",
        highlights: ["Histórico ocupacional", "Documento previdenciário"],
        showDetailsLink: true,
      },
    ],
  },
  {
    id: "seguranca-trabalho",
    title: "Segurança do Trabalho",
    description:
      "Laudos técnicos, programas e análises de risco para apoiar a conformidade legal e a gestão de SST da empresa.",
    contextLine: "Documentação técnica para enquadramento, prevenção e gestão de riscos no ambiente de trabalho.",
    cta: {
      text: "Precisa regularizar laudos, programas ou documentos técnicos?",
      primaryLabel: "Falar com especialista",
      primaryHref: "whatsapp",
      secondaryLabel: "Solicitar proposta",
      secondaryHref: "/contato?tipo=orcamento&area=seguranca-trabalho",
    },
    services: [
      {
        name: "LTCAT",
        badge: "Laudo",
        description:
          "Laudo Técnico das Condições Ambientais do Trabalho para fins previdenciários e enquadramento ocupacional.",
        highlights: ["Fins previdenciários", "Condições ambientais"],
        showDetailsLink: true,
      },
      {
        name: "PGR — Programa de Gerenciamento de Riscos",
        badge: "Programa",
        description:
          "Programa para identificação, avaliação e controle dos riscos ocupacionais, com documentação técnica adequada à empresa.",
        highlights: ["Gestão de riscos", "Conformidade NR-1"],
        showDetailsLink: true,
      },
      {
        name: "Laudo de Insalubridade",
        badge: "Laudo",
        description:
          "Caracterização técnica de atividades insalubres conforme critérios legais aplicáveis.",
        highlights: ["Enquadramento técnico", "Base legal aplicável"],
        showDetailsLink: true,
      },
      {
        name: "Laudo de Periculosidade",
        badge: "Laudo",
        description:
          "Avaliação técnica de atividades com exposição a condições perigosas, como inflamáveis e energia elétrica.",
        highlights: ["Atividades de risco", "Laudo técnico"],
        showDetailsLink: true,
      },
      {
        name: "Análise Ergonômica",
        badge: "Análise",
        description:
          "Avaliação ergonômica do trabalho para identificar riscos e orientar melhorias no ambiente laboral.",
        highlights: ["Postura e esforço", "Melhorias no posto"],
        showDetailsLink: true,
      },
      {
        name: "APR",
        badge: "Análise",
        description:
          "Análise Preliminar de Risco para atividades específicas, rotinas operacionais ou serviços pontuais.",
        highlights: ["Atividades pontuais", "Prevenção operacional"],
        showDetailsLink: true,
      },
      {
        name: "CIPA",
        badge: "Gestão",
        description:
          "Apoio à constituição, organização e funcionamento da Comissão Interna de Prevenção de Acidentes.",
        highlights: ["Processo eleitoral", "Treinamento e apoio"],
        showDetailsLink: true,
      },
      {
        name: "Mapa de Risco",
        badge: "Gestão",
        description:
          "Representação gráfica dos riscos por setor para facilitar a comunicação preventiva na empresa.",
        highlights: ["Visual por setor", "Comunicação preventiva"],
        showDetailsLink: true,
      },
    ],
  },
  {
    id: "exames-complementares",
    title: "Exames Complementares",
    description:
      "Exames de apoio diagnóstico vinculados ao PCMSO, ASO e exigências ocupacionais da empresa.",
    contextLine: "Complementares indicados pelo PCMSO, função ou avaliação médica — com preparo orientado.",
    cta: {
      text: "Consulte orientações de preparo e prazos por exame.",
      primaryLabel: "Ver catálogo de exames e preparos",
      primaryHref: "/exames",
    },
    services: [
      {
        name: "Audiometria",
        badge: "Audição",
        preparoSlug: "audiometria",
        description:
          "Avaliação da audição para colaboradores expostos a ruído ocupacional.",
        highlights: ["Exposição a ruído", "PCMSO e NR-7"],
      },
      {
        name: "Acuidade Visual",
        badge: "Visão",
        preparoSlug: "acuidade-visual",
        description:
          "Teste de visão para avaliar a capacidade visual relacionada à função exercida.",
        highlights: ["Funções com exigência visual", "Triagem rápida"],
      },
      {
        name: "Avaliação Oftalmológica",
        badge: "Visão",
        preparoSlug: "avaliacao-oftalmologica",
        description:
          "Exame oftalmológico completo conforme necessidade ocupacional e indicação clínica.",
        highlights: ["Avaliação completa", "Conforme indicação"],
      },
      {
        name: "Avaliação Psicológica",
        badge: "Neuro",
        preparoSlug: "avaliacao-psicologica",
        description:
          "Avaliação psicológica ocupacional para funções com exigência legal ou de risco específico.",
        highlights: ["Funções regulamentadas", "Aptidão psicológica"],
      },
      {
        name: "Eletrocardiograma",
        badge: "Cardio",
        preparoSlug: "eletrocardiograma",
        description:
          "Avaliação cardíaca para funções com esforço físico, riscos cardíacos ou conforme PCMSO.",
        highlights: ["Esforço físico", "Risco cardiovascular"],
      },
      {
        name: "Eletroencefalograma",
        badge: "Neuro",
        preparoSlug: "eletroencefalograma",
        description:
          "Avaliação neurológica conforme indicação ocupacional e necessidade clínica.",
        highlights: ["Indicação clínica", "Apoio neurológico"],
      },
      {
        name: "Espirometria",
        badge: "Pulmonar",
        preparoSlug: "espirometria",
        description:
          "Avaliação da função pulmonar para exposição a poeiras, vapores ou agentes respiratórios.",
        highlights: ["Agentes respiratórios", "Função pulmonar"],
      },
      {
        name: "Raio-X",
        badge: "Imagem",
        preparoSlug: "radiografias",
        description:
          "Radiografias ocupacionais conforme indicação do PCMSO ou avaliação médica.",
        highlights: ["Conforme PCMSO", "Diversas regiões"],
      },
      {
        name: "Tomografia",
        badge: "Imagem",
        preparoSlug: "tomografia",
        description:
          "Exame de imagem complementar realizado conforme solicitação e indicação clínica.",
        highlights: ["Indicação médica", "Imagem avançada"],
      },
      {
        name: "Endoscopia",
        badge: "Imagem",
        description:
          "Exame endoscópico complementar realizado conforme solicitação e indicação clínica.",
        highlights: ["Indicação médica", "Preparo orientado"],
      },
      {
        name: "Exames Laboratoriais",
        badge: "Laboratorial",
        preparoSlug: "exames-laboratoriais",
        description:
          "Painel laboratorial ocupacional conforme riscos, função e exigências do PCMSO.",
        highlights: ["Painéis por risco", "Jejum orientado"],
      },
      {
        name: "Toxicológico",
        badge: "Toxicológico",
        preparoSlug: "toxicologico",
        description:
          "Exame toxicológico para funções regulamentadas, motoristas profissionais e demais exigências legais.",
        highlights: ["Motoristas e CNH", "Exigências legais"],
      },
    ],
  },
  {
    id: "documentacao",
    title: "Documentação",
    description:
      "Apoio ao RH na organização, controle e conformidade dos documentos ocupacionais — sem substituir laudos e programas técnicos de SST.",
    contextLine: "Menos retrabalho para o RH com documentos organizados, rastreáveis e em conformidade.",
    cta: {
      text: "Quer organizar documentos ocupacionais da sua empresa?",
      primaryLabel: "Solicitar proposta",
      primaryHref: "/contato?tipo=orcamento&area=documentacao",
    },
    services: [
      {
        name: "Eventos de SST no eSocial",
        badge: "Digital",
        description:
          "Apoio ao envio e organização dos eventos de SST exigidos pelo eSocial.",
        highlights: ["Eventos regulatórios", "Menos pendências no RH"],
        showDetailsLink: true,
      },
      {
        name: "Organização documental ocupacional",
        badge: "Gestão",
        description:
          "Estruturação de ASOs, laudos, programas e documentos para facilitar a rotina do RH.",
        highlights: ["ASO, laudos e programas", "Rotina mais clara"],
        showDetailsLink: true,
      },
      {
        name: "Controle de ASO e laudos",
        badge: "Controle",
        description:
          "Acompanhamento de validade, emissão e arquivo de documentos técnicos da empresa.",
        highlights: ["Validade monitorada", "Arquivo organizado"],
        showDetailsLink: true,
      },
      {
        name: "Arquivo técnico ocupacional",
        badge: "Arquivo",
        description:
          "Guarda organizada de prontuários, laudos e registros exigidos pela legislação trabalhista.",
        highlights: ["Prontuários e laudos", "Conformidade legal"],
        showDetailsLink: true,
      },
    ],
  },
];

export const COMPLEMENTARY_EXAM_OPTIONS = [
  "Audiometria",
  "Acuidade visual",
  "Avaliação oftalmológica",
  "Avaliação psicológica",
  "Eletrocardiograma",
  "Eletroencefalograma",
  "Espirometria",
  "Raio-X dorsal",
  "Raio-X lombar",
  "Raio-X tórax",
  "Raio-X cervical",
  "Teste ergométrico",
  "Toxicológico larga janela",
];

export const LAB_EXAM_OPTIONS = [
  "Ácido hipúrico",
  "Ácido metil hipúrico",
  "Ácido úrico",
  "Beta HCG",
  "Colesterol total",
  "Creatinina",
  "Glicemia em jejum",
  "Gama GT",
  "EAS urina",
  "EPF parasitológico",
  "Hemograma completo",
  "Pesquisa de plasmódio",
  "TGP",
  "TGO",
  "Triglicerídeos",
  "VHS",
  "Tipagem sanguínea",
  "VDRL",
];

export const BLOG_POSTS = [
  {
    title: "PCMSO: obrigações e prazos para empresas",
    slug: "pcmso-obrigacoes-prazos",
    excerpt: "Entenda quando sua empresa precisa de PCMSO e quais são os prazos legais.",
    category: "Medicina do trabalho",
    content:
      "O Programa de Controle Médico de Saúde Ocupacional (PCMSO) é obrigatório para empresas que admitam trabalhadores como empregados, conforme NR-7...",
  },
  {
    title: "NR-1 e o novo PGR: o que muda na segurança do trabalho",
    slug: "nr1-novo-pgr",
    excerpt: "A atualização da NR-1 trouxe mudanças importantes no gerenciamento de riscos.",
    category: "Segurança do trabalho",
    content:
      "Com a revisão da NR-1, o PGR substitui gradualmente o PPRA como documento central de gestão de riscos...",
  },
  {
    title: "Exames admissionais: guia rápido para RH",
    slug: "exames-admissionais-guia-rh",
    excerpt: "Saiba quais exames solicitar no processo admissional e como organizar encaminhamentos.",
    category: "Exames ocupacionais",
    content:
      "O exame admissional é o primeiro passo para garantir que o colaborador está apto para a função...",
  },
  {
    title: "5 erros comuns na gestão de ASO",
    slug: "erros-gestao-aso",
    excerpt: "Evite multas e retrabalho com uma gestão organizada de ASOs.",
    category: "Saúde ocupacional",
    content:
      "Muitas empresas ainda armazenam ASOs em pastas físicas sem controle de validade...",
  },
];
