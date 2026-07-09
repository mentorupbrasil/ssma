export type ServiceItem = {
  name: string;
  description: string;
  badge?: string;
  preparoSlug?: string;
};

export type ServiceCategory = {
  id: string;
  title: string;
  description?: string;
  cardVariant?: "clinical" | "technical" | "exam";
  services: ServiceItem[];
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "medicina-ocupacional",
    title: "Medicina Ocupacional",
    description:
      "Atendimento clínico, exames ocupacionais e programas médicos para admissão, acompanhamento periódico e regularização da saúde dos colaboradores.",
    cardVariant: "clinical",
    services: [
      {
        name: "ASO Admissional",
        badge: "ASO",
        description:
          "Avaliação clínica antes do início das atividades, conforme a NR-7 e o PCMSO da empresa.",
      },
      {
        name: "ASO Demissional",
        badge: "ASO",
        description:
          "Exame clínico no encerramento do vínculo empregatício, com emissão do ASO correspondente.",
      },
      {
        name: "ASO Periódico",
        badge: "ASO",
        description:
          "Acompanhamento periódico da saúde dos colaboradores conforme riscos, função e periodicidade definida no PCMSO.",
      },
      {
        name: "Mudança de Função",
        badge: "ASO",
        description:
          "Avaliação clínica quando há alteração de função, setor, riscos ou atividades do colaborador.",
      },
      {
        name: "Retorno ao Trabalho",
        badge: "ASO",
        description:
          "Avaliação após afastamento por doença, acidente ou licença prolongada, com emissão do ASO de retorno.",
      },
      {
        name: "PCMSO",
        badge: "Programa",
        description:
          "Elaboração e acompanhamento do Programa de Controle Médico de Saúde Ocupacional conforme a NR-7.",
      },
      {
        name: "PPP",
        badge: "Documento",
        description:
          "Emissão do Perfil Profissiográfico Previdenciário com base no histórico ocupacional do colaborador.",
      },
    ],
  },
  {
    id: "seguranca-trabalho",
    title: "Segurança do Trabalho",
    description:
      "Laudos técnicos, programas e análises de risco para apoiar a conformidade legal e a gestão de SST da empresa.",
    cardVariant: "technical",
    services: [
      {
        name: "LTCAT",
        badge: "Laudo",
        description:
          "Laudo Técnico das Condições Ambientais do Trabalho para fins previdenciários e enquadramento ocupacional.",
      },
      {
        name: "PGR — Programa de Gerenciamento de Riscos",
        badge: "Programa",
        description:
          "Programa para identificação, avaliação e controle dos riscos ocupacionais, com documentação técnica adequada à empresa.",
      },
      {
        name: "Laudo de Insalubridade",
        badge: "Laudo",
        description:
          "Caracterização técnica de atividades insalubres conforme critérios legais aplicáveis.",
      },
      {
        name: "Laudo de Periculosidade",
        badge: "Laudo",
        description:
          "Avaliação técnica de atividades com exposição a condições perigosas, como inflamáveis e energia elétrica.",
      },
      {
        name: "Análise Ergonômica",
        badge: "Análise",
        description:
          "Avaliação ergonômica do trabalho para identificar riscos e orientar melhorias no ambiente laboral.",
      },
      {
        name: "APR",
        badge: "Análise",
        description:
          "Análise Preliminar de Risco para atividades específicas, rotinas operacionais ou serviços pontuais.",
      },
      {
        name: "CIPA",
        badge: "Gestão",
        description:
          "Apoio à constituição, organização e funcionamento da Comissão Interna de Prevenção de Acidentes.",
      },
      {
        name: "Mapa de Risco",
        badge: "Gestão",
        description:
          "Representação gráfica dos riscos por setor para facilitar a comunicação preventiva na empresa.",
      },
    ],
  },
  {
    id: "exames-complementares",
    title: "Exames Complementares",
    description:
      "Exames de apoio diagnóstico vinculados ao PCMSO, ASO e exigências ocupacionais da empresa.",
    cardVariant: "exam",
    services: [
      {
        name: "Audiometria",
        badge: "Audição",
        preparoSlug: "audiometria",
        description:
          "Avaliação da audição para colaboradores expostos a ruído ocupacional.",
      },
      {
        name: "Acuidade Visual",
        badge: "Visão",
        preparoSlug: "acuidade-visual",
        description:
          "Teste de visão para avaliar a capacidade visual relacionada à função exercida.",
      },
      {
        name: "Avaliação Oftalmológica",
        badge: "Visão",
        preparoSlug: "avaliacao-oftalmologica",
        description:
          "Exame oftalmológico completo conforme necessidade ocupacional e indicação clínica.",
      },
      {
        name: "Avaliação Psicológica",
        badge: "Neuro",
        preparoSlug: "avaliacao-psicologica",
        description:
          "Avaliação psicológica ocupacional para funções com exigência legal ou de risco específico.",
      },
      {
        name: "Eletrocardiograma",
        badge: "Cardio",
        preparoSlug: "eletrocardiograma",
        description:
          "Avaliação cardíaca para funções com esforço físico, riscos cardíacos ou conforme PCMSO.",
      },
      {
        name: "Eletroencefalograma",
        badge: "Neuro",
        preparoSlug: "eletroencefalograma",
        description:
          "Avaliação neurológica conforme indicação ocupacional e necessidade clínica.",
      },
      {
        name: "Espirometria",
        badge: "Pulmonar",
        preparoSlug: "espirometria",
        description:
          "Avaliação da função pulmonar para exposição a poeiras, vapores ou agentes respiratórios.",
      },
      {
        name: "Raio-X",
        badge: "Imagem",
        preparoSlug: "radiografias",
        description:
          "Radiografias ocupacionais conforme indicação do PCMSO ou avaliação médica.",
      },
      {
        name: "Tomografia",
        badge: "Imagem",
        preparoSlug: "tomografia",
        description:
          "Exame de imagem complementar realizado conforme solicitação e indicação clínica.",
      },
      {
        name: "Exames Laboratoriais",
        badge: "Laboratorial",
        preparoSlug: "exames-laboratoriais",
        description:
          "Painel laboratorial ocupacional conforme riscos, função e exigências do PCMSO.",
      },
      {
        name: "Toxicológico",
        badge: "Toxicológico",
        preparoSlug: "toxicologico",
        description:
          "Exame toxicológico para funções regulamentadas, motoristas profissionais e demais exigências legais.",
      },
    ],
  },
  {
    id: "documentacao",
    title: "Documentação",
    description:
      "Apoio ao RH na organização, controle e conformidade dos documentos ocupacionais — sem substituir laudos e programas técnicos de SST.",
    cardVariant: "technical",
    services: [
      {
        name: "Eventos de SST no eSocial",
        badge: "Digital",
        description:
          "Apoio ao envio e organização dos eventos de SST exigidos pelo eSocial.",
      },
      {
        name: "Organização documental ocupacional",
        badge: "Gestão",
        description:
          "Estruturação de ASOs, laudos, programas e documentos para facilitar a rotina do RH.",
      },
      {
        name: "Controle de ASO e laudos",
        badge: "Controle",
        description:
          "Acompanhamento de validade, emissão e arquivo de documentos técnicos da empresa.",
      },
      {
        name: "Arquivo técnico ocupacional",
        badge: "Arquivo",
        description:
          "Guarda organizada de prontuários, laudos e registros exigidos pela legislação trabalhista.",
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