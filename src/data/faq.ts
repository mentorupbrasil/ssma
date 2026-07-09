export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqCategory = {
  id: string;
  label: string;
  items: FaqItem[];
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "inicio",
    label: "Primeiros passos",
    items: [
      {
        question: "Como solicito orçamento para minha empresa?",
        answer:
          "Pelo formulário em Contato (opção orçamento) ou pelo WhatsApp. Informe porte da empresa, quantidade de colaboradores e quais exames ou documentos você precisa. A equipe comercial retorna com proposta detalhada — sem compromisso.",
      },
      {
        question: "Dá para encaminhar colaborador pelo site?",
        answer:
          "Sim. No Encaminhamento online você envia dados do colaborador, tipo de exame (admissional, periódico, demissional etc.) e exames complementares quando houver. Isso evita retrabalho e agiliza o agendamento na clínica.",
      },
      {
        question: "Atendem empresas pequenas e MEI?",
        answer:
          "Atendemos empresas de pequeno, médio e grande porte, incluindo MEI com funcionário. O orçamento é montado conforme a realidade da sua empresa — não é só para indústria grande.",
      },
      {
        question: "Preciso fechar contrato antes do primeiro exame?",
        answer:
          "Para empresa nova, o ideal é alinhar orçamento e cadastro antes. Em casos pontuais (um admissional urgente, por exemplo), fale com a recepção — muitas vezes conseguimos encaixar e regularizar a documentação em seguida.",
      },
    ],
  },
  {
    id: "exames",
    label: "Exames e prazos",
    items: [
      {
        question: "Quais exames ocupacionais a Unimetra realiza?",
        answer:
          "Realizamos exames clínicos ocupacionais (admissional, periódico, demissional, retorno e mudança de função) e diversos complementares conforme estrutura do dia: audiometria, acuidade visual, espirometria, eletrocardiograma e outros. Laboratorial e imagem podem ser orientados com parceiros quando necessário.",
      },
      {
        question: "O exame admissional precisa ser agendado?",
        answer:
          "Sim, o ideal é agendar ou encaminhar com antecedência para organizar o fluxo e evitar fila. Pelo encaminhamento online ou WhatsApp você informa o tipo de exame e recebe orientação de horário e documentos necessários.",
      },
      {
        question: "Onde consulto o preparo dos exames?",
        answer:
          "Na página Exames e preparos do site você busca por nome ou categoria e vê orientações de jejum, preparo e prazos. Em caso de dúvida específica, fale com a equipe antes do atendimento.",
      },
      {
        question: "O prazo de resultado é sempre o mesmo?",
        answer:
          "Não. Exame clínico com ASO costuma sair no mesmo dia após liberação médica. Quando há complementar pendente (audiometria, ECG, laboratorial), o prazo depende do laudo — a recepção informa a estimativa no agendamento.",
      },
    ],
  },
  {
    id: "documentos",
    label: "Documentos e SST",
    items: [
      {
        question: "A Unimetra emite ASO?",
        answer:
          "Sim. O Atestado de Saúde Ocupacional é emitido após a avaliação clínica e conclusão dos exames necessários, conforme NR-7 e o PCMSO da empresa.",
      },
      {
        question: "Vocês auxiliam com PCMSO, PGR e LTCAT?",
        answer:
          "Atuamos na parte médica do PCMSO e na execução dos exames previstos no programa. Elaboração completa de PCMSO, PGR e LTCAT costuma ser feita por consultoria em SST ou engenharia de segurança — podemos orientar o fluxo ou executar exames com base no programa já pronto.",
      },
      {
        question: "A empresa consegue acessar documentos online?",
        answer:
          "Empresas cadastradas no portal empresarial conseguem acompanhar encaminhamentos, documentos liberados e pendências. O acesso é liberado após cadastro — solicite na recepção ou pelo comercial.",
      },
      {
        question: "Como funciona a organização de ASO e laudos?",
        answer:
          "Os documentos são vinculados ao colaborador e à empresa, com entrega organizada após liberação. O RH pode acompanhar pelo portal quando cadastrado, reduzindo dependência de e-mail e telefone para cada consulta.",
      },
    ],
  },
  {
    id: "orcamento",
    label: "Empresas e orçamento",
    items: [
      {
        question: "Como é calculado o orçamento?",
        answer:
          "Com base no porte da empresa, quantidade de colaboradores, tipos de exames, documentos necessários (PCMSO, laudos, eventos SST) e frequência de atendimento. A proposta é personalizada — não há tabela única para todos os casos.",
      },
      {
        question: "Posso solicitar proposta para vários colaboradores?",
        answer:
          "Sim. Informe quantos admissionais, periódicos ou demissionais você prevê, ou envie a lista de colaboradores e funções. A equipe comercial monta a proposta conforme a demanda real da empresa.",
      },
      {
        question: "Empresas com contrato têm valores diferentes?",
        answer:
          "Empresas com contrato ou volume recorrente costumam ter condições comerciais alinhadas ao fluxo mensal de exames e documentos. Os detalhes são combinados na proposta e no contrato de prestação de serviços.",
      },
      {
        question: "Como falar com a equipe comercial?",
        answer:
          "Pelo WhatsApp, formulário de Contato (opção orçamento) ou presencialmente na clínica. Informe CNPJ, porte e o que você precisa — retornamos com proposta sem compromisso.",
      },
    ],
  },
];
