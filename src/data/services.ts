export type ServiceItem = {
  name: string;
  description: string;
  audience: string;
  deliveryTime: string;
};

export type ServiceCategory = {
  id: string;
  title: string;
  services: ServiceItem[];
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "medicina-ocupacional",
    title: "Medicina Ocupacional",
    services: [
      {
        name: "ASO Admissional",
        description: "Avaliação clínica para admissão de colaboradores conforme NR-7.",
        audience: "Empresas que admitem novos colaboradores",
        deliveryTime: "No dia do atendimento",
      },
      {
        name: "ASO Demissional",
        description: "Exame clínico demissional para encerramento do vínculo empregatício.",
        audience: "Empresas em processo de desligamento",
        deliveryTime: "No dia do atendimento",
      },
      {
        name: "ASO Periódico",
        description: "Acompanhamento periódico da saúde dos colaboradores expostos a riscos.",
        audience: "Empresas com PCMSO ativo",
        deliveryTime: "No dia do atendimento",
      },
      {
        name: "Mudança de Função",
        description: "Avaliação clínica quando há alteração de atividades ou setor.",
        audience: "Empresas com movimentação interna",
        deliveryTime: "No dia do atendimento",
      },
      {
        name: "Retorno ao Trabalho",
        description: "Avaliação após afastamento por doença ou acidente.",
        audience: "Empresas com colaboradores retornando de afastamento",
        deliveryTime: "No dia do atendimento",
      },
      {
        name: "PCMSO",
        description: "Programa de Controle Médico de Saúde Ocupacional completo.",
        audience: "Empresas de todos os portes",
        deliveryTime: "Conforme escopo contratado",
      },
      {
        name: "Gestão de Absenteísmo",
        description: "Monitoramento e análise de faltas relacionadas à saúde ocupacional.",
        audience: "Empresas com alto índice de absenteísmo",
        deliveryTime: "Relatórios mensais",
      },
      {
        name: "PPP",
        description: "Perfil Profissiográfico Previdenciário para fins previdenciários.",
        audience: "Empresas e colaboradores",
        deliveryTime: "5 a 10 dias úteis",
      },
      {
        name: "Perícias Médicas",
        description: "Avaliações médicas especializadas para processos administrativos.",
        audience: "Empresas e seguradoras",
        deliveryTime: "Conforme agendamento",
      },
    ],
  },
  {
    id: "seguranca-trabalho",
    title: "Segurança do Trabalho",
    services: [
      {
        name: "LTCAT",
        description: "Laudo Técnico das Condições Ambientais do Trabalho.",
        audience: "Empresas com exposição a agentes nocivos",
        deliveryTime: "15 a 30 dias úteis",
      },
      {
        name: "PGR / PPRA",
        description: "Programa de Gerenciamento de Riscos e documentação histórica PPRA.",
        audience: "Empresas de todos os portes",
        deliveryTime: "20 a 45 dias úteis",
      },
      {
        name: "Laudo de Insalubridade",
        description: "Caracterização de atividades insalubres conforme NR-15.",
        audience: "Empresas com atividades em ambientes insalubres",
        deliveryTime: "10 a 20 dias úteis",
      },
      {
        name: "Laudo de Periculosidade",
        description: "Avaliação de atividades perigosas conforme NR-16.",
        audience: "Empresas com exposição a inflamáveis, energia elétrica etc.",
        deliveryTime: "10 a 20 dias úteis",
      },
      {
        name: "Análise Ergonômica",
        description: "Avaliação ergonômica do trabalho (AET) conforme NR-17.",
        audience: "Empresas com postos de trabalho diversos",
        deliveryTime: "15 a 30 dias úteis",
      },
      {
        name: "APR",
        description: "Análise Preliminar de Risco para atividades específicas.",
        audience: "Empresas com atividades de risco pontual",
        deliveryTime: "5 a 10 dias úteis",
      },
      {
        name: "CIPA",
        description: "Apoio à constituição e funcionamento da CIPA.",
        audience: "Empresas obrigadas à CIPA",
        deliveryTime: "Conforme calendário",
      },
      {
        name: "Mapa de Risco",
        description: "Representação gráfica dos riscos ambientais por setor.",
        audience: "Empresas com gestão de SST estruturada",
        deliveryTime: "10 a 15 dias úteis",
      },
      {
        name: "Palestras e Treinamentos",
        description: "Capacitação em segurança do trabalho e saúde ocupacional.",
        audience: "Empresas de todos os portes",
        deliveryTime: "Conforme programação",
      },
    ],
  },
  {
    id: "exames-complementares",
    title: "Exames Complementares",
    services: [
      { name: "Audiometria", description: "Avaliação da audição ocupacional.", audience: "Expostos a ruído", deliveryTime: "No dia" },
      { name: "Acuidade Visual", description: "Teste de visão para função.", audience: "Diversos setores", deliveryTime: "No dia" },
      { name: "Avaliação Oftalmológica", description: "Exame oftalmológico completo.", audience: "Funções com exigência visual", deliveryTime: "No dia" },
      { name: "Avaliação Psicológica", description: "Avaliação psicológica ocupacional.", audience: "Motoristas, vigilantes etc.", deliveryTime: "1 a 3 dias úteis" },
      { name: "Eletrocardiograma", description: "Avaliação cardíaca.", audience: "Esforço físico e riscos cardíacos", deliveryTime: "No dia" },
      { name: "Eletroencefalograma", description: "Avaliação neurológica.", audience: "Conforme PCMSO", deliveryTime: "1 a 3 dias úteis" },
      { name: "Espirometria", description: "Avaliação da função pulmonar.", audience: "Expostos a poeiras e vapores", deliveryTime: "No dia" },
      { name: "Raio-X", description: "Radiografias ocupacionais.", audience: "Conforme PCMSO", deliveryTime: "1 a 2 dias úteis" },
      { name: "Tomografia", description: "Exame de imagem avançado.", audience: "Conforme indicação médica", deliveryTime: "2 a 5 dias úteis" },
      { name: "Exames Laboratoriais", description: "Painel laboratorial ocupacional.", audience: "Exposição a agentes químicos", deliveryTime: "1 a 3 dias úteis" },
      { name: "Toxicológico", description: "Exame toxicológico para CNH e funções reguladas.", audience: "Motoristas e funções críticas", deliveryTime: "3 a 7 dias úteis" },
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
    answer: "Preencha o formulário de contato ou clique em 'Solicitar orçamento'. Nossa equipe retorna em até 1 dia útil.",
  },
  {
    question: "A empresa pode encaminhar colaboradores online?",
    answer: "Sim. Use o Encaminhamento Online ou acesse o portal da empresa após cadastro.",
  },
  {
    question: "Quanto tempo demora o resultado dos exames?",
    answer: "Varia por exame. ASO é entregue no dia; laboratoriais em 1-3 dias úteis. Consulte a página de Exames.",
  },
  {
    question: "Vocês atendem empresas de qualquer porte?",
    answer: "Sim. Atendemos pequenas, médias e grandes empresas com soluções personalizadas.",
  },
  {
    question: "Como funciona a integração com SOC?",
    answer: "Oferecemos apoio e integração quando necessário para empresas que utilizam o sistema SOC.",
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
