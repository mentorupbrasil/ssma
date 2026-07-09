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
          "Atendemos. Não é só indústria grande: comércio, prestadores de serviço, construção e MEI com funcionário também passam por admissional, periódico e documentação SST. O orçamento é montado conforme a sua realidade.",
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
        question: "Em quanto tempo sai o ASO?",
        answer:
          "Exame clínico com ASO no mesmo dia costuma sair após a conclusão do atendimento e liberação médica. Se houver exame complementar pendente (audiometria, ECG, laboratorial), o ASO só fecha quando o laudo entra — a recepção avisa o prazo estimado no ato do agendamento.",
      },
      {
        question: "Quais exames vão no admissional?",
        answer:
          "O clínico ocupacional é a base. Complementares dependem da função, dos riscos do ambiente e do que estiver no PCMSO/PGR da empresa — audiometria, espirometria, acuidade visual, eletrocardiograma e laboratoriais são os mais comuns. Na dúvida, mande a função e o setor que orientamos.",
      },
      {
        question: "O que acontece se o colaborador faltar?",
        answer:
          "A falta precisa ser comunicada com antecedência quando possível. Reagendamos conforme disponibilidade. Faltas repetidas sem aviso podem gerar cobrança de taxa ou novo encaminhamento, conforme combinado no contrato com a empresa.",
      },
      {
        question: "Fazem exames complementares aí na clínica?",
        answer:
          "Vários sim: avaliação clínica, audiometria, acuidade, espirometria e outros conforme estrutura do dia. Laboratorial e imagem podem ser feitos em parceiros — no encaminhamento já deixamos claro o que é na Unimetra e o que é externo.",
      },
    ],
  },
  {
    id: "documentos",
    label: "Documentos e SST",
    items: [
      {
        question: "Quais documentos a empresa precisa arquivar?",
        answer:
          "No mínimo: ASOs, fichas de encaminhamento, programas (PCMSO, PGR quando aplicável), LTCAT se houver agente nocivo, PPP e eventos de SST no eSocial. Prazo de guarda do ASO é de 20 anos após desligamento — organizar desde o admissional evita dor de cabeça em fiscalização.",
      },
      {
        question: "Vocês elaboram PCMSO e PGR?",
        answer:
          "A clínica atua na parte médica do PCMSO e no apoio aos exames previstos no programa. Elaboração completa de PCMSO, PGR e laudos técnicos costuma ser feita por consultoria em SST ou engenharia de segurança parceira — podemos indicar fluxo ou receber o programa já pronto para executar os exames.",
      },
      {
        question: "O RH acompanha status pelo portal?",
        answer:
          "Empresas cadastradas no portal conseguem ver encaminhamentos, documentos liberados e pendências sem depender só de e-mail ou telefone. O acesso é liberado após cadastro — se sua empresa ainda não tem login, peça na recepção ou pelo comercial.",
      },
      {
        question: "Trabalham com SOC ou outro sistema?",
        answer:
          "Sim. Muitas empresas da região usam SOC; encaminhamos e recebemos fichas nesse fluxo quando o cliente já opera assim. O importante é os dados do colaborador e do exame chegarem completos — o canal (portal, SOC ou presencial) é o que for mais prático para o RH.",
      },
    ],
  },
];
