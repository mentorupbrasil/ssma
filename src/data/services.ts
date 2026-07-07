export type ServiceItem = {
  name: string;
  description: string;
  audience: string;
  deliveryTime: string;
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
      "Serviços clínicos e programas médicos para admissão, acompanhamento e regularização da saúde ocupacional dos colaboradores.",
    services: [
      {
        name: "ASO Admissional",
        description: "Avaliação clínica para admissão de colaboradores conforme a NR-7.",
        audience: "Empresas que estão contratando novos colaboradores.",
        deliveryTime: "No dia do atendimento.",
      },
      {
        name: "ASO Demissional",
        description: "Exame clínico para encerramento do vínculo empregatício.",
        audience: "Empresas em processo de desligamento.",
        deliveryTime: "No dia do atendimento.",
      },
      {
        name: "ASO Periódico",
        description:
          "Acompanhamento periódico da saúde dos colaboradores expostos a riscos ocupacionais.",
        audience: "Empresas com PCMSO ativo.",
        deliveryTime: "No dia do atendimento.",
      },
      {
        name: "Mudança de Função",
        description:
          "Avaliação clínica quando há alteração de função, setor, riscos ou atividades.",
        audience: "Empresas com movimentação interna de colaboradores.",
        deliveryTime: "No dia do atendimento.",
      },
      {
        name: "Retorno ao Trabalho",
        description: "Avaliação após afastamento por doença, acidente ou licença prolongada.",
        audience: "Colaboradores retornando às atividades.",
        deliveryTime: "No dia do atendimento.",
      },
      {
        name: "PCMSO",
        description: "Programa de Controle Médico de Saúde Ocupacional conforme a NR-7.",
        audience: "Empresas de todos os portes.",
        deliveryTime: "Conforme escopo contratado.",
      },
      {
        name: "Gestão de Absenteísmo",
        description:
          "Monitoramento e análise de faltas, afastamentos e impactos na rotina ocupacional.",
        audience: "Empresas que desejam mais controle sobre afastamentos.",
        deliveryTime: "Relatórios mensais.",
      },
      {
        name: "PPP",
        description:
          "Perfil Profissiográfico Previdenciário para fins previdenciários e histórico ocupacional.",
        audience: "Empresas e colaboradores.",
        deliveryTime: "5 a 10 dias úteis.",
      },
      {
        name: "Perícias Médicas",
        description:
          "Avaliações médicas especializadas para processos administrativos, ocupacionais ou judiciais.",
        audience: "Empresas, seguradoras e demandas específicas.",
        deliveryTime: "Conforme agendamento.",
      },
    ],
  },
  {
    id: "seguranca-trabalho",
    title: "Segurança do Trabalho",
    description:
      "Laudos, programas, análises e treinamentos para manter sua empresa regularizada e com os riscos ocupacionais sob controle.",
    cardVariant: "technical",
    services: [
      {
        name: "LTCAT",
        badge: "Laudo",
        description:
          "Laudo Técnico das Condições Ambientais do Trabalho para fins previdenciários e enquadramento ocupacional.",
        audience: "Empresas com exposição a agentes nocivos.",
        deliveryTime: "15 a 30 dias úteis.",
      },
      {
        name: "PGR — Programa de Gerenciamento de Riscos",
        badge: "Programa",
        description:
          "Programa para identificação, avaliação e controle dos riscos ocupacionais, com documentação técnica adequada à realidade da empresa.",
        audience: "Empresas de todos os portes.",
        deliveryTime: "20 a 45 dias úteis.",
      },
      {
        name: "Laudo de Insalubridade",
        badge: "Laudo",
        description:
          "Avaliação técnica para caracterização de atividades insalubres conforme critérios aplicáveis.",
        audience: "Empresas com atividades em ambientes insalubres.",
        deliveryTime: "10 a 20 dias úteis.",
      },
      {
        name: "Laudo de Periculosidade",
        badge: "Laudo",
        description: "Avaliação técnica de atividades com exposição a condições perigosas.",
        audience:
          "Empresas com exposição a inflamáveis, energia elétrica ou outras condições de risco.",
        deliveryTime: "10 a 20 dias úteis.",
      },
      {
        name: "Análise Ergonômica",
        badge: "Análise",
        description:
          "Avaliação ergonômica do trabalho para identificar riscos e propor melhorias no ambiente laboral.",
        audience: "Empresas com postos de trabalho diversos.",
        deliveryTime: "15 a 30 dias úteis.",
      },
      {
        name: "APR",
        badge: "Análise",
        description:
          "Análise Preliminar de Risco para atividades específicas, rotinas operacionais ou serviços pontuais.",
        audience: "Empresas com atividades de risco pontual.",
        deliveryTime: "5 a 10 dias úteis.",
      },
      {
        name: "CIPA",
        badge: "Gestão",
        description:
          "Apoio à constituição, organização e funcionamento da Comissão Interna de Prevenção de Acidentes.",
        audience: "Empresas obrigadas a constituir CIPA.",
        deliveryTime: "Conforme calendário.",
      },
      {
        name: "Mapa de Risco",
        badge: "Gestão",
        description:
          "Representação gráfica dos riscos ambientais por setor, facilitando a comunicação preventiva.",
        audience: "Empresas com gestão de SST estruturada.",
        deliveryTime: "10 a 15 dias úteis.",
      },
      {
        name: "Palestras e Treinamentos",
        badge: "Treinamento",
        description:
          "Capacitações em segurança do trabalho e saúde ocupacional para equipes e empresas.",
        audience: "Empresas de todos os portes.",
        deliveryTime: "Conforme programação.",
      },
    ],
  },
  {
    id: "exames-complementares",
    title: "Exames Complementares",
    description:
      "Exames ocupacionais complementares para apoiar admissões, periódicos, demissionais e demais exigências do PCMSO.",
    cardVariant: "exam",
    services: [
      {
        name: "Audiometria",
        badge: "Audição",
        preparoSlug: "audiometria",
        description: "Avaliação da audição ocupacional para colaboradores expostos a ruído.",
        audience: "Funções com exposição a ruído ocupacional.",
        deliveryTime: "No dia.",
      },
      {
        name: "Acuidade Visual",
        badge: "Visão",
        preparoSlug: "acuidade-visual",
        description: "Teste de visão para avaliação da capacidade visual relacionada à função.",
        audience: "Diversos setores e funções operacionais.",
        deliveryTime: "No dia.",
      },
      {
        name: "Avaliação Oftalmológica",
        badge: "Visão",
        preparoSlug: "avaliacao-oftalmologica",
        description: "Exame oftalmológico completo conforme necessidade ocupacional.",
        audience: "Funções com exigência visual.",
        deliveryTime: "No dia.",
      },
      {
        name: "Avaliação Psicológica",
        badge: "Neuro",
        preparoSlug: "avaliacao-psicologica",
        description:
          "Avaliação psicológica ocupacional conforme função, risco ou exigência legal.",
        audience: "Motoristas, vigilantes e funções específicas.",
        deliveryTime: "1 a 3 dias úteis.",
      },
      {
        name: "Eletrocardiograma",
        badge: "Cardio",
        preparoSlug: "eletrocardiograma",
        description: "Avaliação da atividade elétrica do coração para fins ocupacionais.",
        audience: "Funções com esforço físico, riscos cardíacos ou conforme PCMSO.",
        deliveryTime: "No dia.",
      },
      {
        name: "Eletroencefalograma",
        badge: "Neuro",
        preparoSlug: "eletroencefalograma",
        description: "Avaliação da atividade elétrica cerebral conforme indicação ocupacional.",
        audience: "Funções específicas ou conforme PCMSO.",
        deliveryTime: "1 a 3 dias úteis.",
      },
      {
        name: "Espirometria",
        badge: "Pulmonar",
        preparoSlug: "espirometria",
        description:
          "Avaliação da função pulmonar para colaboradores expostos a poeiras, vapores ou agentes respiratórios.",
        audience: "Funções com exposição respiratória ocupacional.",
        deliveryTime: "No dia.",
      },
      {
        name: "Raio-X",
        badge: "Imagem",
        preparoSlug: "radiografias",
        description: "Radiografias ocupacionais conforme indicação do PCMSO ou avaliação médica.",
        audience: "Colaboradores com exposição ou necessidade específica.",
        deliveryTime: "2 dias úteis.",
      },
      {
        name: "Tomografia",
        badge: "Imagem",
        preparoSlug: "tomografia",
        description: "Exame de imagem complementar realizado conforme solicitação médica.",
        audience: "Casos específicos com indicação clínica.",
        deliveryTime: "2 a 5 dias úteis.",
      },
      {
        name: "Exames Laboratoriais",
        badge: "Laboratorial",
        preparoSlug: "exames-laboratoriais",
        description: "Painel laboratorial ocupacional conforme riscos, função e PCMSO.",
        audience:
          "Funções com exposição a agentes químicos, biológicos ou conforme exigência.",
        deliveryTime: "1 a 3 dias úteis.",
      },
      {
        name: "Toxicológico",
        badge: "Toxicológico",
        preparoSlug: "toxicologico",
        description: "Exame toxicológico para funções regulamentadas ou de risco.",
        audience: "Motoristas profissionais e funções críticas.",
        deliveryTime: "3 a 7 dias úteis.",
      },
    ],
  },
  {
    id: "documentacao",
    title: "Documentação",
    description:
      "Emissão, organização e controle dos documentos ocupacionais exigidos para empresas.",
    services: [
      {
        name: "Eventos de SST no eSocial",
        description: "Apoio ao envio e organização dos eventos de SST exigidos pelo eSocial.",
        audience: "Empresas que precisam manter conformidade digital.",
        deliveryTime: "Conforme calendário e escopo.",
      },
      {
        name: "Organização documental ocupacional",
        description: "Estruturação de ASO, laudos, programas e documentos para o RH.",
        audience: "Empresas que buscam mais clareza na gestão documental.",
        deliveryTime: "Conforme diagnóstico inicial.",
      },
      {
        name: "Controle de ASO e laudos",
        description: "Acompanhamento de validade, emissão e arquivo de documentos técnicos.",
        audience: "Empresas com volume recorrente de colaboradores.",
        deliveryTime: "Contínuo.",
      },
      {
        name: "Arquivo técnico ocupacional",
        description: "Guarda organizada de prontuários, laudos e registros exigidos pela legislação.",
        audience: "Empresas que precisam de rastreabilidade documental.",
        deliveryTime: "Conforme contrato.",
      },
    ],
  },
  {
    id: "treinamentos",
    title: "Treinamentos",
    description:
      "Capacitação em segurança do trabalho, integração e conformidade para colaboradores e gestores.",
    services: [
      {
        name: "Palestras em SST",
        description: "Conteúdos educativos sobre saúde ocupacional, riscos e prevenção.",
        audience: "Empresas de todos os portes.",
        deliveryTime: "Conforme programação.",
      },
      {
        name: "Treinamento de CIPA",
        description: "Capacitação para membros da Comissão Interna de Prevenção de Acidentes.",
        audience: "Empresas obrigadas ou que desejam estruturar a CIPA.",
        deliveryTime: "Conforme calendário.",
      },
      {
        name: "Integração em segurança do trabalho",
        description: "Orientação inicial sobre riscos, EPIs e procedimentos da empresa.",
        audience: "Empresas com admissões recorrentes.",
        deliveryTime: "No dia ou conforme agenda.",
      },
      {
        name: "Capacitação NR-6 (EPI)",
        description: "Treinamento sobre uso, guarda, conservação e substituição de EPIs.",
        audience: "Colaboradores expostos a riscos que exigem EPI.",
        deliveryTime: "Conforme programação.",
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

export const FAQ_ITEMS = [
  {
    question: "Como solicitar orçamento para minha empresa?",
    answer:
      "Você pode solicitar orçamento pelo formulário do site ou falar diretamente com um especialista. Nossa equipe entende o porte da empresa, quantidade de colaboradores, exames necessários e documentos ocupacionais para montar uma proposta adequada.",
  },
  {
    question: "A empresa pode encaminhar colaboradores online?",
    answer:
      "Sim. O encaminhamento online permite enviar os dados do colaborador, tipo de exame ocupacional e exames complementares de forma mais organizada, reduzindo retrabalho para o RH.",
  },
  {
    question: "Quanto tempo demora o resultado dos exames?",
    answer:
      "O prazo pode variar conforme o tipo de exame e a demanda de atendimento. Exames clínicos e ocupacionais seguem fluxo interno da clínica, e a empresa pode acompanhar as orientações e status conforme o serviço contratado.",
  },
  {
    question: "Vocês atendem empresas de qualquer porte?",
    answer:
      "Sim. A estrutura atende empresas de pequeno, médio e grande porte, com soluções para admissões, periódicos, demissionais, retorno ao trabalho, mudança de função e demandas de SST.",
  },
  {
    question: "Como funciona a integração com SOC?",
    answer:
      "A clínica pode apoiar empresas que utilizam SOC ou outros fluxos de gestão ocupacional, auxiliando no encaminhamento, organização das informações e acompanhamento dos processos necessários.",
  },
  {
    question: "Quais documentos ocupacionais a empresa precisa manter em dia?",
    answer:
      "Entre os principais documentos estão PCMSO, ASO, PGR, LTCAT, PPP e eventos de SST no eSocial, conforme o tipo de atividade, riscos ocupacionais e exigências legais aplicáveis.",
  },
  {
    question: "O RH consegue acompanhar o status dos colaboradores?",
    answer:
      "Sim. A proposta do portal empresarial é permitir que a empresa acompanhe encaminhamentos, exames, histórico e status dos colaboradores com mais clareza e menos dependência de planilhas e ligações.",
  },
];

export const BLOG_POSTS = [
  {
    title: "PCMSO: obrigações e prazos para empresas",
    slug: "pcmso-obrigacoes-prazos",
    excerpt: "Entenda quando sua empresa precisa de PCMSO e quais são os prazos legais.",
    category: "Medicina do trabalho",
    content: "O Programa de Controle Médico de Saúde Ocupacional (PCMSO) é obrigatório para empresas que admitam trabalhadores como empregados, conforme NR-7...",
  },
  {
    title: "NR-1 e o novo PGR: o que muda na segurança do trabalho",
    slug: "nr1-novo-pgr",
    excerpt: "A atualização da NR-1 trouxe mudanças importantes no gerenciamento de riscos.",
    category: "Segurança do trabalho",
    content: "Com a revisão da NR-1, o PGR substitui gradualmente o PPRA como documento central de gestão de riscos...",
  },
  {
    title: "Exames admissionais: guia rápido para RH",
    slug: "exames-admissionais-guia-rh",
    excerpt: "Saiba quais exames solicitar no processo admissional e como organizar encaminhamentos.",
    category: "Exames ocupacionais",
    content: "O exame admissional é o primeiro passo para garantir que o colaborador está apto para a função...",
  },
  {
    title: "5 erros comuns na gestão de ASO",
    slug: "erros-gestao-aso",
    excerpt: "Evite multas e retrabalho com uma gestão organizada de ASOs.",
    category: "Saúde ocupacional",
    content: "Muitas empresas ainda armazenam ASOs em pastas físicas sem controle de validade...",
  },
];
