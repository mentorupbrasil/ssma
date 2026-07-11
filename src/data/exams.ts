import { ExamCategory } from "@prisma/client";

export type PreparationStatus =
  | "SEM_PREPARO"
  | "PREPARO_NECESSARIO"
  | "JEJUM_NECESSARIO"
  | "ATENCAO_ESPECIAL"
  | "VERIFICAR_EXAME"
  | "ORIENTACAO_ESPECIFICA";

export type ExamDisplayCategory = "COMPLEMENTAR" | "LABORATORIAL" | "IMAGEM" | "TOXICOLOGICO";

export type ExamGuide = {
  name: string;
  slug: string;
  category: ExamCategory;
  displayCategory: ExamDisplayCategory;
  preparationStatus: PreparationStatus;
  preparationSummary: string;
  preparationBefore: string;
  preparationOnDay: string;
  deliveryTime: string;
  notes?: string;
  whenToInformClinic: string;
};

/** @deprecated Use ExamGuide — mantido para seed e compatibilidade. */
export type ExamData = {
  name: string;
  slug: string;
  category: ExamCategory;
  preparation: string;
  deliveryTime: string;
  notes?: string;
};

export const EXAM_GUIDES: ExamGuide[] = [
  {
    name: "Audiometria",
    slug: "audiometria",
    category: "COMPLEMENTAR",
    displayCategory: "COMPLEMENTAR",
    preparationStatus: "PREPARO_NECESSARIO",
    preparationSummary: "Repouso acústico de 14 horas antes do exame.",
    preparationBefore:
      "Repouso acústico de 14 horas. Evitar exposição a ruídos fortes, fones de ouvido, som alto e ambientes barulhentos antes da avaliação.",
    preparationOnDay:
      "Comparecer no horário agendado e informar exposição recente a ruído intenso ou desconforto auditivo.",
    deliveryTime: "No dia do exame",
    notes: "Importante para colaboradores expostos a ruído ocupacional.",
    whenToInformClinic:
      "Informe exposição a ruído intenso nas 14 horas anteriores, desconforto auditivo ou histórico de perda auditiva.",
  },
  {
    name: "Acuidade Visual",
    slug: "acuidade-visual",
    category: "COMPLEMENTAR",
    displayCategory: "COMPLEMENTAR",
    preparationStatus: "SEM_PREPARO",
    preparationSummary: "Não requer preparo específico.",
    preparationBefore: "Não requer preparo específico.",
    preparationOnDay: "Levar óculos ou lentes de contato, caso utilize.",
    deliveryTime: "No dia do exame",
    notes: "Avalia a capacidade visual relacionada à função.",
    whenToInformClinic:
      "Informe alterações recentes na visão, cirurgias oftalmológicas ou dificuldade para enxergar.",
  },
  {
    name: "Avaliação Oftalmológica",
    slug: "avaliacao-oftalmologica",
    category: "COMPLEMENTAR",
    displayCategory: "COMPLEMENTAR",
    preparationStatus: "SEM_PREPARO",
    preparationSummary: "Não requer preparo específico.",
    preparationBefore: "Não requer preparo específico.",
    preparationOnDay:
      "Levar óculos, lentes ou receitas oftalmológicas anteriores, caso possua.",
    deliveryTime: "No dia do exame",
    notes: "Indicada para funções com exigência visual.",
    whenToInformClinic:
      "Informe uso de lentes, cirurgias oftalmológicas recentes ou sintomas visuais persistentes.",
  },
  {
    name: "Avaliação Psicológica",
    slug: "avaliacao-psicologica",
    category: "COMPLEMENTAR",
    displayCategory: "COMPLEMENTAR",
    preparationStatus: "SEM_PREPARO",
    preparationSummary: "Não requer preparo específico.",
    preparationBefore: "Não requer preparo específico.",
    preparationOnDay: "Comparecer descansado e no horário agendado.",
    deliveryTime: "1 a 3 dias úteis",
    notes: "Pode ser exigida para motoristas, vigilantes e funções específicas.",
    whenToInformClinic:
      "Informe uso contínuo de medicamentos, afastamentos recentes ou condições que possam impactar a avaliação.",
  },
  {
    name: "Eletrocardiograma",
    slug: "eletrocardiograma",
    category: "COMPLEMENTAR",
    displayCategory: "COMPLEMENTAR",
    preparationStatus: "PREPARO_NECESSARIO",
    preparationSummary: "Pele limpa e desengordurada na região do tórax.",
    preparationBefore:
      "Pele limpa e desengordurada. Evitar cremes, óleos ou loções na região do tórax.",
    preparationOnDay:
      "Pode ser necessária remoção de pelos na região para melhor fixação dos eletrodos.",
    deliveryTime: "No dia do exame",
    notes: "Avaliação da atividade elétrica do coração.",
    whenToInformClinic:
      "Informe marcapasso, arritmias, cirurgias cardíacas ou sintomas como dor no peito e falta de ar.",
  },
  {
    name: "Eletroencefalograma",
    slug: "eletroencefalograma",
    category: "COMPLEMENTAR",
    displayCategory: "COMPLEMENTAR",
    preparationStatus: "SEM_PREPARO",
    preparationSummary: "Comparecer com cabelos limpos e secos.",
    preparationBefore: "Não requer preparo específico, salvo orientação da clínica.",
    preparationOnDay: "Comparecer com cabelos limpos e secos, sem gel, creme ou óleo.",
    deliveryTime: "1 a 3 dias úteis",
    notes: "Avaliação da atividade elétrica cerebral conforme indicação ocupacional.",
    whenToInformClinic:
      "Informe uso de medicamentos neurológicos, convulsões recentes ou alterações de consciência.",
  },
  {
    name: "Espirometria",
    slug: "espirometria",
    category: "COMPLEMENTAR",
    displayCategory: "COMPLEMENTAR",
    preparationStatus: "PREPARO_NECESSARIO",
    preparationSummary: "Evitar refeição volumosa, cigarro e álcool antes do exame.",
    preparationBefore:
      "Evitar refeição volumosa 1 hora antes. Evitar cigarro 2 horas antes. Evitar bebida alcoólica 4 horas antes.",
    preparationOnDay:
      "Informar uso de medicamentos respiratórios, crises recentes ou sintomas respiratórios.",
    deliveryTime: "No dia do exame",
    notes: "Avaliação da função pulmonar.",
    whenToInformClinic:
      "Informe asma, bronquite, uso de bombinha ou sintomas respiratórios no dia do exame.",
  },
  {
    name: "Radiografias",
    slug: "radiografias",
    category: "COMPLEMENTAR",
    displayCategory: "IMAGEM",
    preparationStatus: "ATENCAO_ESPECIAL",
    preparationSummary: "Em geral, não requer preparo específico.",
    preparationBefore: "Em geral, não requer preparo específico.",
    preparationOnDay:
      "Gestantes ou pessoas com suspeita de gravidez devem informar a condição antes do exame.",
    deliveryTime: "1 a 2 dias úteis",
    notes: "Realizada conforme indicação ocupacional ou médica.",
    whenToInformClinic:
      "Informe gravidez, suspeita de gravidez, implantes metálicos ou exames radiológicos recentes.",
  },
  {
    name: "Tomografia",
    slug: "tomografia",
    category: "COMPLEMENTAR",
    displayCategory: "IMAGEM",
    preparationStatus: "JEJUM_NECESSARIO",
    preparationSummary: "Jejum de 6 horas, salvo orientação da clínica.",
    preparationBefore: "Jejum de 6 horas, salvo orientação diferente da clínica.",
    preparationOnDay:
      "Informar alergias, uso de medicamentos, doenças renais, gravidez ou suspeita de gravidez.",
    deliveryTime: "2 a 5 dias úteis",
    notes: "Medicamentos e contraste devem seguir orientação da clínica.",
    whenToInformClinic:
      "Informe alergia a contraste, insuficiência renal, diabetes, gravidez ou uso de anticoagulantes.",
  },
  {
    name: "Exames Laboratoriais",
    slug: "exames-laboratoriais",
    category: "LABORATORIAL",
    displayCategory: "LABORATORIAL",
    preparationStatus: "VERIFICAR_EXAME",
    preparationSummary: "O preparo depende do exame solicitado.",
    preparationBefore:
      "O preparo depende do exame solicitado. Alguns exames podem exigir jejum.",
    preparationOnDay:
      "Levar solicitação ou encaminhamento e informar medicamentos em uso.",
    deliveryTime: "1 a 3 dias úteis",
    notes: "Consultar preparo específico para cada exame laboratorial.",
    whenToInformClinic:
      "Informe medicamentos em uso, condições clínicas relevantes e dúvidas sobre jejum antes da coleta.",
  },
  {
    name: "Endoscopia",
    slug: "endoscopia",
    category: "IMAGEM",
    displayCategory: "IMAGEM",
    preparationStatus: "JEJUM_NECESSARIO",
    preparationSummary: "Jejum de 8 horas, salvo orientação da clínica.",
    preparationBefore:
      "Jejum de 8 horas (sólidos e líquidos), salvo orientação diferente da clínica. Suspender ou ajustar medicamentos apenas mediante orientação médica.",
    preparationOnDay:
      "Comparecer com acompanhante, pois pode haver sedação. Levar exames anteriores e informar medicamentos em uso.",
    deliveryTime: "Conforme agendamento",
    notes: "Realizada conforme solicitação médica e indicação clínica.",
    whenToInformClinic:
      "Informe uso de anticoagulantes, alergias a medicamentos, diabetes, gravidez ou cirurgias recentes.",
  },
  {
    name: "Toxicológico",
    slug: "toxicologico",
    category: "COMPLEMENTAR",
    displayCategory: "TOXICOLOGICO",
    preparationStatus: "ORIENTACAO_ESPECIFICA",
    preparationSummary: "Seguir orientação da clínica ou laboratório responsável.",
    preparationBefore: "Seguir orientação da clínica ou laboratório responsável.",
    preparationOnDay:
      "Levar documento oficial com foto e informações exigidas para coleta.",
    deliveryTime: "3 a 7 dias úteis",
    notes: "Indicado para motoristas profissionais e funções regulamentadas.",
    whenToInformClinic:
      "Informe função exercida, exigência legal aplicável e medicamentos de uso contínuo.",
  },
];

export const INITIAL_EXAMS: ExamData[] = EXAM_GUIDES.map((guide) => ({
  name: guide.name,
  slug: guide.slug,
  category: guide.category,
  preparation: guide.preparationBefore,
  deliveryTime: guide.deliveryTime,
  notes: guide.notes,
}));

export function getExamGuideBySlug(slug: string): ExamGuide | undefined {
  return EXAM_GUIDES.find((guide) => guide.slug === slug);
}
