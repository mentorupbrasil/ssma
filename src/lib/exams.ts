import type {
  Exam,
  ExamCategory,
  ExamStatus,
  ExamPreparationType,
  ExamDeadlineType,
  ExamHistoryAction,
  Prisma,
} from "@prisma/client";
import type { ExamGuide, PreparationStatus } from "@/data/exams";

export const EXAM_STAT_CARDS: { key: string; filter: string; label: string }[] = [
  { key: "ativos", filter: "ATIVO", label: "Exames ativos" },
  { key: "inativos", filter: "INATIVO", label: "Inativos" },
  { key: "sem_preparo", filter: "SEM_PREPARO", label: "Sem preparo específico" },
  { key: "preparo_obrigatorio", filter: "PREPARO_OBRIGATORIO", label: "Com preparo obrigatório" },
  { key: "laboratoriais", filter: "LABORATORIAL", label: "Laboratoriais" },
  { key: "no_site", filter: "ON_SITE", label: "Exibidos no site" },
];

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  CLINICO_OCUPACIONAL: "Clínico ocupacional",
  COMPLEMENTAR: "Complementar",
  LABORATORIAL: "Laboratorial",
  IMAGEM: "Imagem",
  TOXICOLOGICO: "Toxicológico",
  AVALIACAO_ESPECIALIZADA: "Avaliação especializada",
  OUTRO: "Outro",
};

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  EM_REVISAO: "Em revisão",
};

export const EXAM_PREPARATION_LABELS: Record<ExamPreparationType, string> = {
  SEM_PREPARO: "Sem preparo específico",
  PREPARO_NECESSARIO: "Preparo necessário",
  JEJUM_NECESSARIO: "Jejum necessário",
  ATENCAO_ESPECIAL: "Atenção especial",
  VERIFICAR_EXAME: "Verificar exame solicitado",
  ORIENTACAO_ESPECIFICA: "Orientação específica",
};

export const EXAM_DEADLINE_TYPE_LABELS: Record<ExamDeadlineType, string> = {
  NO_DIA: "No dia",
  DIAS_UTEIS: "Dias úteis",
  CONFORME_AGENDAMENTO: "Conforme agendamento",
  CONFORME_LABORATORIO: "Conforme laboratório",
};

export const EXAM_HISTORY_ACTION_LABELS: Record<ExamHistoryAction, string> = {
  CREATED: "Exame criado",
  UPDATED: "Dados editados",
  PREPARATION_CHANGED: "Preparo alterado",
  DEADLINE_CHANGED: "Prazo alterado",
  STATUS_CHANGED: "Status alterado",
  PUBLISHED: "Publicado no site",
  UNPUBLISHED: "Ocultado do site",
  DUPLICATED: "Exame duplicado",
};

const PREPARO_OBRIGATORIO_TYPES: ExamPreparationType[] = [
  "PREPARO_NECESSARIO",
  "JEJUM_NECESSARIO",
  "ATENCAO_ESPECIAL",
  "VERIFICAR_EXAME",
  "ORIENTACAO_ESPECIFICA",
];

export function examNeedsPreparation(type: ExamPreparationType): boolean {
  return type !== "SEM_PREPARO";
}

export function empresaPreparationBadgeLabel(type: ExamPreparationType): string {
  return examNeedsPreparation(type) ? "Preparo necessário" : "Sem preparo específico";
}

export { PREPARO_OBRIGATORIO_TYPES };

export type ExamListFilters = {
  q?: string;
  card?: string;
  category?: string;
  status?: string;
  preparationType?: string;
  showOnWebsite?: string;
  requiresAppointment?: string;
  deadline?: string;
  sort?: string;
  page?: number;
};

export type ExamListItem = {
  id: string;
  name: string;
  slug: string;
  category: ExamCategory;
  shortDescription: string | null;
  preparationType: ExamPreparationType;
  averageDeadline: string | null;
  showOnWebsite: boolean;
  status: ExamStatus;
  updatedAt: string;
};

export type ExamHistoryItem = {
  id: string;
  action: ExamHistoryAction;
  notes: string | null;
  performedByName: string | null;
  createdAt: string;
};

export type ExamDetailSerialized = ExamListItem & {
  preparationBefore: string | null;
  instructionsOnDay: string | null;
  deadlineType: ExamDeadlineType | null;
  observations: string | null;
  whenToNotifyClinic: string | null;
  requiresAppointment: boolean;
  requiresProfessional: boolean;
  requiresAttachment: boolean;
  availableOnPublicForm: boolean;
  availableOnCompanyPortal: boolean;
  displayOrder: number | null;
  internalTags: string | null;
  createdAt: string;
  history: ExamHistoryItem[];
};

export type ExamSelectOption = {
  id: string;
  name: string;
  category: ExamCategory;
  preparationType: ExamPreparationType;
  preparationBefore: string | null;
  instructionsOnDay: string | null;
  averageDeadline: string | null;
};

const PAGE_SIZE = 15;

export function getExamPageSize() {
  return PAGE_SIZE;
}

export function slugifyExamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function inferDeadlineType(text: string | null | undefined): ExamDeadlineType | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes("no dia")) return "NO_DIA";
  if (lower.includes("dias úteis") || lower.includes("dias uteis")) return "DIAS_UTEIS";
  if (lower.includes("agendamento")) return "CONFORME_AGENDAMENTO";
  if (lower.includes("laborat")) return "CONFORME_LABORATORIO";
  return "DIAS_UTEIS";
}

export function categoryToDisplayCategory(
  category: ExamCategory
): ExamGuide["displayCategory"] {
  if (category === "LABORATORIAL") return "LABORATORIAL";
  if (category === "IMAGEM") return "IMAGEM";
  if (category === "TOXICOLOGICO") return "TOXICOLOGICO";
  return "COMPLEMENTAR";
}

export function examToGuide(exam: Pick<
  Exam,
  | "name"
  | "slug"
  | "category"
  | "preparationType"
  | "preparationBefore"
  | "instructionsOnDay"
  | "averageDeadline"
  | "observations"
  | "whenToNotifyClinic"
  | "shortDescription"
>): ExamGuide {
  const preparationStatus = exam.preparationType as PreparationStatus;
  return {
    name: exam.name,
    slug: exam.slug,
    category: exam.category === "CLINICO_OCUPACIONAL" || exam.category === "AVALIACAO_ESPECIALIZADA"
      ? "COMPLEMENTAR"
      : exam.category === "IMAGEM" || exam.category === "TOXICOLOGICO"
        ? "COMPLEMENTAR"
        : exam.category,
    displayCategory: categoryToDisplayCategory(exam.category),
    preparationStatus,
    preparationSummary:
      exam.preparationBefore?.split(".")[0]?.trim() ??
      EXAM_PREPARATION_LABELS[exam.preparationType],
    preparationBefore: exam.preparationBefore ?? "Não informado.",
    preparationOnDay: exam.instructionsOnDay ?? "Comparecer no horário agendado.",
    deliveryTime: exam.averageDeadline ?? "Consultar clínica",
    notes: exam.observations ?? exam.shortDescription ?? undefined,
    whenToInformClinic: exam.whenToNotifyClinic ?? "Informe condições relevantes à clínica.",
  };
}

export function buildExamListWhere(filters: ExamListFilters): Prisma.ExamWhereInput {
  const where: Prisma.ExamWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  const card = filters.card;
  if (card && card !== "ALL") {
    switch (card) {
      case "ATIVO":
      case "INATIVO":
        where.status = card as ExamStatus;
        break;
      case "SEM_PREPARO":
        where.preparationType = "SEM_PREPARO";
        break;
      case "PREPARO_OBRIGATORIO":
        where.preparationType = { in: PREPARO_OBRIGATORIO_TYPES };
        break;
      case "LABORATORIAL":
        where.category = "LABORATORIAL";
        break;
      case "ON_SITE":
        where.showOnWebsite = true;
        where.status = "ATIVO";
        break;
    }
  }

  if (filters.category && filters.category !== "ALL") {
    where.category = filters.category as ExamCategory;
  }
  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as ExamStatus;
  }
  if (filters.preparationType && filters.preparationType !== "ALL") {
    where.preparationType = filters.preparationType as ExamPreparationType;
  }
  if (filters.showOnWebsite === "true") where.showOnWebsite = true;
  if (filters.showOnWebsite === "false") where.showOnWebsite = false;
  if (filters.requiresAppointment === "true") where.requiresAppointment = true;
  if (filters.requiresAppointment === "false") where.requiresAppointment = false;
  if (filters.deadline && filters.deadline !== "ALL") {
    where.deadlineType = filters.deadline as ExamDeadlineType;
  }

  return where;
}

export function buildExamOrderBy(sort?: string): Prisma.ExamOrderByWithRelationInput[] {
  switch (sort) {
    case "category":
      return [{ category: "asc" }, { name: "asc" }];
    case "status":
      return [{ status: "asc" }, { name: "asc" }];
    case "displayOrder":
      return [{ displayOrder: "asc" }, { name: "asc" }];
    default:
      return [{ name: "asc" }];
  }
}

export function serializeExamListItem(exam: Exam): ExamListItem {
  return {
    id: exam.id,
    name: exam.name,
    slug: exam.slug,
    category: exam.category,
    shortDescription: exam.shortDescription,
    preparationType: exam.preparationType,
    averageDeadline: exam.averageDeadline,
    showOnWebsite: exam.showOnWebsite,
    status: exam.status,
    updatedAt: exam.updatedAt.toISOString(),
  };
}

export function serializeExamDetail(
  exam: Exam & {
    history: Array<{
      id: string;
      action: ExamHistoryAction;
      notes: string | null;
      createdAt: Date;
      performedBy: { name: string } | null;
    }>;
  }
): ExamDetailSerialized {
  return {
    ...serializeExamListItem(exam),
    preparationBefore: exam.preparationBefore,
    instructionsOnDay: exam.instructionsOnDay,
    deadlineType: exam.deadlineType,
    observations: exam.observations,
    whenToNotifyClinic: exam.whenToNotifyClinic,
    requiresAppointment: exam.requiresAppointment,
    requiresProfessional: exam.requiresProfessional,
    requiresAttachment: exam.requiresAttachment,
    availableOnPublicForm: exam.availableOnPublicForm,
    availableOnCompanyPortal: exam.availableOnCompanyPortal,
    displayOrder: exam.displayOrder,
    internalTags: exam.internalTags,
    createdAt: exam.createdAt.toISOString(),
    history: exam.history.map((h) => ({
      id: h.id,
      action: h.action,
      notes: h.notes,
      performedByName: h.performedBy?.name ?? null,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}

export const ACTIVE_EXAM_WHERE: Prisma.ExamWhereInput = { status: "ATIVO" };

export const PUBLIC_WEBSITE_EXAM_WHERE: Prisma.ExamWhereInput = {
  status: "ATIVO",
  showOnWebsite: true,
};

export const PUBLIC_FORM_EXAM_WHERE: Prisma.ExamWhereInput = {
  status: "ATIVO",
  availableOnPublicForm: true,
};

export const REFERRAL_SELECT_EXAM_WHERE: Prisma.ExamWhereInput = {
  status: "ATIVO",
};

export const COMPANY_PORTAL_EXAM_WHERE: Prisma.ExamWhereInput = {
  status: "ATIVO",
  availableOnCompanyPortal: true,
};

export type ExamSeedData = {
  name: string;
  slug: string;
  category: ExamCategory;
  shortDescription: string;
  preparationType: ExamPreparationType;
  preparationBefore: string;
  instructionsOnDay: string;
  averageDeadline: string;
  deadlineType: ExamDeadlineType;
  observations: string;
  whenToNotifyClinic: string;
  requiresAppointment?: boolean;
  displayOrder?: number;
};

export const CATALOG_SEED_EXAMS: ExamSeedData[] = [
  {
    name: "Acuidade Visual",
    slug: "acuidade-visual",
    category: "COMPLEMENTAR",
    shortDescription: "Teste de visão para avaliação da capacidade visual relacionada à função.",
    preparationType: "SEM_PREPARO",
    preparationBefore: "Não requer preparo específico.",
    instructionsOnDay: "Levar óculos ou lentes de contato, caso utilize.",
    averageDeadline: "No dia do exame",
    deadlineType: "NO_DIA",
    observations: "Avalia a capacidade visual relacionada à função.",
    whenToNotifyClinic: "Informe alterações recentes na visão ou dificuldade para enxergar.",
    displayOrder: 1,
  },
  {
    name: "Audiometria",
    slug: "audiometria",
    category: "COMPLEMENTAR",
    shortDescription: "Avaliação da audição ocupacional para colaboradores expostos a ruído.",
    preparationType: "PREPARO_NECESSARIO",
    preparationBefore:
      "Repouso acústico de 14 horas. Evitar exposição a ruídos fortes, fones de ouvido, som alto e ambientes barulhentos antes da avaliação.",
    instructionsOnDay: "Informar exposição recente a ruído intenso ou desconforto auditivo.",
    averageDeadline: "No dia do exame",
    deadlineType: "NO_DIA",
    observations: "Importante para colaboradores expostos a ruído ocupacional.",
    whenToNotifyClinic: "Informe exposição a ruído intenso nas 14 horas anteriores.",
    displayOrder: 2,
  },
  {
    name: "Avaliação Oftalmológica",
    slug: "avaliacao-oftalmologica",
    category: "COMPLEMENTAR",
    shortDescription: "Exame oftalmológico completo conforme necessidade ocupacional.",
    preparationType: "SEM_PREPARO",
    preparationBefore: "Não requer preparo específico.",
    instructionsOnDay: "Levar óculos, lentes ou receitas oftalmológicas anteriores, caso possua.",
    averageDeadline: "No dia do exame",
    deadlineType: "NO_DIA",
    observations: "Indicada para funções com exigência visual.",
    whenToNotifyClinic: "Informe uso de lentes ou cirurgias oftalmológicas recentes.",
    displayOrder: 3,
  },
  {
    name: "Avaliação Psicológica",
    slug: "avaliacao-psicologica",
    category: "AVALIACAO_ESPECIALIZADA",
    shortDescription: "Avaliação psicológica ocupacional conforme função, risco ou exigência legal.",
    preparationType: "SEM_PREPARO",
    preparationBefore: "Não requer preparo específico.",
    instructionsOnDay: "Comparecer descansado e no horário agendado.",
    averageDeadline: "1 a 3 dias úteis",
    deadlineType: "DIAS_UTEIS",
    observations: "Pode ser exigida para motoristas, vigilantes e funções específicas.",
    whenToNotifyClinic: "Informe uso contínuo de medicamentos ou afastamentos recentes.",
    requiresAppointment: true,
    displayOrder: 4,
  },
  {
    name: "Eletrocardiograma",
    slug: "eletrocardiograma",
    category: "COMPLEMENTAR",
    shortDescription: "Avaliação da atividade elétrica do coração para fins ocupacionais.",
    preparationType: "PREPARO_NECESSARIO",
    preparationBefore:
      "Pele limpa e desengordurada. Evitar cremes, óleos ou loções na região do tórax.",
    instructionsOnDay: "Pode ser necessária remoção de pelos na região para melhor fixação dos eletrodos.",
    averageDeadline: "No dia do exame",
    deadlineType: "NO_DIA",
    observations: "Avaliação da atividade elétrica do coração.",
    whenToNotifyClinic: "Informe marcapasso, arritmias ou sintomas cardíacos.",
    displayOrder: 5,
  },
  {
    name: "Eletroencefalograma",
    slug: "eletroencefalograma",
    category: "COMPLEMENTAR",
    shortDescription: "Avaliação da atividade elétrica cerebral conforme indicação ocupacional.",
    preparationType: "PREPARO_NECESSARIO",
    preparationBefore:
      "Não utilizar gel, creme, óleo ou produtos no cabelo, salvo orientação diferente da clínica.",
    instructionsOnDay: "Comparecer com cabelos limpos e secos.",
    averageDeadline: "1 a 3 dias úteis",
    deadlineType: "DIAS_UTEIS",
    observations: "Avaliação conforme indicação ocupacional.",
    whenToNotifyClinic: "Informe uso de medicamentos neurológicos ou convulsões recentes.",
    displayOrder: 6,
  },
  {
    name: "Espirometria",
    slug: "espirometria",
    category: "COMPLEMENTAR",
    shortDescription:
      "Avaliação da função pulmonar para colaboradores expostos a poeiras, vapores ou agentes respiratórios.",
    preparationType: "PREPARO_NECESSARIO",
    preparationBefore:
      "Evitar refeição volumosa 1 hora antes. Evitar cigarro 2 horas antes. Evitar bebida alcoólica 4 horas antes.",
    instructionsOnDay:
      "Informar uso de medicamentos respiratórios, crises recentes ou sintomas respiratórios.",
    averageDeadline: "No dia do exame",
    deadlineType: "NO_DIA",
    observations: "Avaliação da função pulmonar.",
    whenToNotifyClinic: "Informe asma, bronquite ou sintomas respiratórios no dia do exame.",
    displayOrder: 7,
  },
  {
    name: "Exames Laboratoriais",
    slug: "exames-laboratoriais",
    category: "LABORATORIAL",
    shortDescription: "Painel laboratorial ocupacional conforme riscos, função e PCMSO.",
    preparationType: "VERIFICAR_EXAME",
    preparationBefore:
      "O preparo depende do exame solicitado. Alguns exames podem exigir jejum.",
    instructionsOnDay: "Levar solicitação ou encaminhamento e informar medicamentos em uso.",
    averageDeadline: "1 a 3 dias úteis",
    deadlineType: "CONFORME_LABORATORIO",
    observations: "Consultar preparo específico para cada exame laboratorial.",
    whenToNotifyClinic: "Informe medicamentos em uso e dúvidas sobre jejum antes da coleta.",
    displayOrder: 8,
  },
  {
    name: "Radiografias",
    slug: "radiografias",
    category: "IMAGEM",
    shortDescription: "Radiografias ocupacionais conforme indicação do PCMSO ou avaliação médica.",
    preparationType: "ATENCAO_ESPECIAL",
    preparationBefore: "Em geral, não requer preparo específico.",
    instructionsOnDay:
      "Gestantes ou pessoas com suspeita de gravidez devem informar a condição antes do exame.",
    averageDeadline: "1 a 2 dias úteis",
    deadlineType: "DIAS_UTEIS",
    observations: "Realizada conforme indicação ocupacional ou médica.",
    whenToNotifyClinic: "Informe gravidez, suspeita de gravidez ou implantes metálicos.",
    displayOrder: 9,
  },
  {
    name: "Tomografia",
    slug: "tomografia",
    category: "IMAGEM",
    shortDescription: "Exame de imagem complementar realizado conforme solicitação médica.",
    preparationType: "JEJUM_NECESSARIO",
    preparationBefore: "Jejum de 6 horas, salvo orientação diferente da clínica.",
    instructionsOnDay:
      "Informar alergias, uso de medicamentos, doenças renais, gravidez ou suspeita de gravidez.",
    averageDeadline: "2 a 5 dias úteis",
    deadlineType: "DIAS_UTEIS",
    observations: "Medicamentos e contraste devem seguir orientação da clínica.",
    whenToNotifyClinic: "Informe alergia a contraste, insuficiência renal ou gravidez.",
    requiresAppointment: true,
    displayOrder: 10,
  },
  {
    name: "Endoscopia",
    slug: "endoscopia",
    category: "IMAGEM",
    shortDescription: "Exame endoscópico complementar conforme solicitação e indicação clínica.",
    preparationType: "JEJUM_NECESSARIO",
    preparationBefore:
      "Jejum de 8 horas (sólidos e líquidos), salvo orientação diferente da clínica. Suspender ou ajustar medicamentos apenas mediante orientação médica.",
    instructionsOnDay:
      "Comparecer com acompanhante, pois pode haver sedação. Levar exames anteriores e informar medicamentos em uso.",
    averageDeadline: "Conforme agendamento",
    deadlineType: "CONFORME_AGENDAMENTO",
    observations: "Realizada conforme solicitação médica e indicação clínica.",
    whenToNotifyClinic:
      "Informe uso de anticoagulantes, alergias a medicamentos, diabetes, gravidez ou cirurgias recentes.",
    requiresAppointment: true,
    displayOrder: 11,
  },
  {
    name: "Toxicológico",
    slug: "toxicologico",
    category: "TOXICOLOGICO",
    shortDescription: "Exame toxicológico para funções regulamentadas ou de risco.",
    preparationType: "ORIENTACAO_ESPECIFICA",
    preparationBefore: "Seguir orientação da clínica ou laboratório responsável.",
    instructionsOnDay: "Levar documento oficial com foto e informações exigidas para coleta.",
    averageDeadline: "3 a 7 dias úteis",
    deadlineType: "DIAS_UTEIS",
    observations: "Indicado para motoristas profissionais e funções regulamentadas.",
    whenToNotifyClinic: "Informe função exercida e exigência legal aplicável.",
    displayOrder: 12,
  },
];
