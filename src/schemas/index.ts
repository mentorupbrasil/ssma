import { z } from "zod";

export const cpfSchema = z
  .string()
  .min(11, "CPF inválido")
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos");

export const cnpjSchema = z
  .string()
  .min(14, "CNPJ/CPF inválido")
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11 || v.length === 14, "Documento inválido");

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z
    .string()
    .refine((v) => {
      const trimmed = v.trim();
      return trimmed.length === 0 || z.string().email().safeParse(trimmed).success;
    }, "E-mail inválido"),
  phone: z.string().min(10, "Telefone/WhatsApp obrigatório"),
  company: z.string().optional(),
  subject: z
    .string()
    .min(1, "Selecione um assunto")
    .refine(
      (v) =>
        [
          "Solicitar orçamento",
          "Encaminhamento de colaborador",
          "Dúvida sobre exames",
          "Portal empresarial",
          "Suporte para empresa",
          "Outro",
        ].includes(v),
      "Assunto inválido"
    ),
  message: z.string().min(5, "Mensagem obrigatória"),
  consent: z.literal(true, { message: "Consentimento obrigatório" }),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const quoteSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  companyName: z.string().min(2, "Nome da empresa obrigatório"),
  employees: z.string().optional(),
  message: z.string().optional(),
  consent: z.literal(true, { message: "Consentimento obrigatório" }),
});

export const referralStep1Schema = z.object({
  companyName: z.string().min(2, "Nome da empresa obrigatório"),
  companyDocument: cnpjSchema,
  companyPhone: z.string().min(10, "Telefone obrigatório"),
  companyEmail: z.string().email("E-mail inválido"),
  authorizerName: z.string().min(2, "Responsável obrigatório"),
});

export const referralStep2Schema = z.object({
  patientName: z.string().min(2, "Nome completo obrigatório"),
  patientCpf: cpfSchema,
  patientRg: z.string().optional(),
  birthDate: z.string().min(1, "Data de nascimento obrigatória"),
  gender: z.enum(["M", "F", "OUTRO"], { message: "Selecione o sexo" }),
  jobTitle: z.string().min(2, "Função obrigatória"),
  department: z.string().min(1, "Setor obrigatório"),
  patientPhone: z.string().optional(),
});

export const referralStep3Schema = z.object({
  clinicalExamType: z.enum([
    "ADMISSIONAL",
    "DEMISSIONAL",
    "PERIODICO",
    "MUDANCA_FUNCAO",
    "RETORNO_TRABALHO",
  ]),
});

export const referralStep4Schema = z.object({
  complementaryExams: z.array(z.string()),
});

export const referralStep5Schema = z.object({
  labExams: z.array(z.string()),
});

export const referralStep6Schema = z.object({
  consent: z.literal(true, { message: "Consentimento obrigatório" }),
});

export const referralFormSchema = referralStep1Schema
  .merge(referralStep2Schema)
  .merge(referralStep3Schema)
  .merge(referralStep4Schema)
  .merge(referralStep5Schema)
  .merge(referralStep6Schema);

export type ReferralFormData = z.infer<typeof referralFormSchema>;

const optionalDocumentField = z
  .string()
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length === 0 || digits.length === 11 || digits.length === 14;
  }, "Documento inválido");

const optionalCpfField = z
  .string()
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length === 0 || digits.length === 11;
  }, "CPF inválido");

const optionalEmailField = z
  .string()
  .refine((v) => {
    const trimmed = v.trim();
    return trimmed.length === 0 || z.string().email().safeParse(trimmed).success;
  }, "E-mail inválido");

export const preReferralStep1Schema = z.object({
  companyName: z.string().min(2, "Nome da empresa obrigatório"),
  companyDocument: optionalDocumentField,
  responsibleName: z.string().min(2, "Nome do responsável obrigatório"),
  whatsapp: z.string().min(10, "WhatsApp obrigatório"),
  email: optionalEmailField,
});

export const preReferralStep2Schema = z.object({
  employeeName: z.string().min(2, "Nome do colaborador obrigatório"),
  employeeDocument: optionalCpfField,
  employeeRole: z.string().min(2, "Função obrigatória"),
  clinicalExamType: z.enum([
    "ADMISSIONAL",
    "DEMISSIONAL",
    "PERIODICO",
    "RETORNO_TRABALHO",
    "MUDANCA_FUNCAO",
    "NAO_SEI_INFORMAR",
  ]),
});

export const preReferralStep3Schema = z.object({
  examSelectionMode: z.enum(["NAO_SEI", "SELECIONAR", "ANEXAR_FUTURO"]),
  selectedExams: z.array(z.string()),
  notes: z.string().optional(),
  consentAccepted: z.literal(true, {
    message: "É necessário aceitar o termo para continuar",
  }),
});

export const preReferralFormSchema = preReferralStep1Schema
  .merge(preReferralStep2Schema)
  .merge(preReferralStep3Schema)
  .superRefine((data, ctx) => {
    if (data.examSelectionMode === "SELECIONAR" && data.selectedExams.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione ao menos um exame complementar",
        path: ["selectedExams"],
      });
    }
  });

export type PreReferralFormData = z.infer<typeof preReferralFormSchema>;

export const preReferralStatusSchema = z.enum([
  "NOVO",
  "EM_ANALISE",
  "AGUARDANDO_RETORNO",
  "CONVERTIDO",
  "CANCELADO",
  "DUPLICADO",
]);

export const companySchema = z.object({
  legalName: z.string().min(2, "Razão social obrigatória"),
  tradeName: z.string().optional(),
  cnpj: cnpjSchema,
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().min(10, "WhatsApp obrigatório"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  responsibleName: z.string().optional(),
  responsibleRole: z.string().optional(),
  stateRegistration: z.string().optional(),
  size: z.enum(["PEQUENA", "MEDIA", "GRANDE"]).optional(),
  segment: z.string().optional(),
  contractType: z.enum(["AVULSO", "MENSAL", "ANUAL", "EM_NEGOCIACAO"]).optional(),
  portalEnabled: z.boolean().optional(),
  status: z.enum(["ATIVA", "INATIVA", "PENDENTE", "BLOQUEADA"]).optional(),
  notes: z.string().optional(),
});

export const createCompanySchema = companySchema;

export const updateCompanySchema = companySchema.partial().extend({
  legalName: z.string().min(2).optional(),
  cnpj: cnpjSchema.optional(),
  whatsapp: z.string().min(10).optional(),
});

export const companyStatusSchema = z.enum(["ATIVA", "INATIVA", "PENDENTE", "BLOQUEADA"]);

export const companyContactSchema = z.object({
  type: z.enum(["SITE", "WHATSAPP", "TELEFONE", "EMAIL", "VISITA", "COMERCIAL", "OUTRO"]),
  title: z.string().optional(),
  notes: z.string().min(3, "Observação obrigatória"),
});

export const patientSchema = z.object({
  fullName: z.string().min(2, "Nome obrigatório"),
  cpf: cpfSchema,
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  companyId: z.string().min(1, "Empresa obrigatória"),
  jobTitle: z.string().min(1, "Função obrigatória"),
  department: z.string().optional(),
  admissionDate: z.string().optional(),
  nextPeriodicDate: z.string().optional(),
  status: z.enum(["ATIVO", "INATIVO", "AFASTADO", "DESLIGADO", "PENDENTE"]).optional(),
  notes: z.string().optional(),
});

export const createCollaboratorSchema = patientSchema;

export const updateCollaboratorSchema = patientSchema.partial().extend({
  fullName: z.string().min(2).optional(),
  cpf: cpfSchema.optional(),
  jobTitle: z.string().min(1).optional(),
  companyId: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum([
    "ADMIN",
    "RECEPCAO",
    "MEDICO",
    "TECNICO",
    "FINANCEIRO",
    "EMPRESA",
    "VISUALIZADOR",
  ]),
  companyId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const referralStatusSchema = z.enum([
  "NOVO",
  "EM_ANALISE",
  "AGUARDANDO_AGENDAMENTO",
  "AGENDADO",
  "EM_ATENDIMENTO",
  "AGUARDANDO_RESULTADO",
  "AGUARDANDO_DOCUMENTO",
  "ASO_DISPONIVEL",
  "CONCLUIDO",
  "CANCELADO",
]);

export const leadStatusSchema = z.enum([
  "NOVO",
  "EM_CONTATO",
  "PROPOSTA_ENVIADA",
  "FECHADO",
  "PERDIDO",
  "EXPIRADO",
]);

export const appointmentStatusSchema = z.enum([
  "AGENDADO",
  "CONFIRMADO",
  "EM_ATENDIMENTO",
  "CONCLUIDO",
  "FALTOU",
  "REAGENDADO",
  "CANCELADO",
]);

export const appointmentSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  scheduledAt: z.string().min(1, "Data/hora obrigatória"),
  patientId: z.string().min(1, "Paciente obrigatório"),
  companyId: z.string().optional(),
  referralId: z.string().optional(),
  type: z.string().optional(),
  notes: z.string().optional(),
  status: appointmentStatusSchema.default("AGENDADO"),
});

export const createAppointmentSchema = z.object({
  title: z.string().optional(),
  scheduledAt: z.string().min(1, "Data/hora obrigatória"),
  endAt: z.string().optional(),
  patientId: z.string().min(1, "Colaborador obrigatório"),
  companyId: z.string().optional(),
  referralId: z.string().optional(),
  protocol: z.string().optional(),
  clinicalExamType: z
    .enum([
      "ADMISSIONAL",
      "DEMISSIONAL",
      "PERIODICO",
      "MUDANCA_FUNCAO",
      "RETORNO_TRABALHO",
    ])
    .optional(),
  type: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  attendanceNotes: z.string().optional(),
  professionalId: z.string().optional(),
  roomName: z.string().optional(),
  examIds: z.array(z.string()).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  scheduledAt: z.string().min(1, "Nova data/hora obrigatória"),
  notes: z.string().min(3, "Informe o motivo do reagendamento"),
});

export const cancelAppointmentSchema = z.object({
  notes: z.string().min(3, "Informe o motivo"),
});

export const addAppointmentNoteSchema = z.object({
  note: z.string().min(2, "Observação obrigatória"),
  type: z.enum(["internal", "attendance"]).default("internal"),
});

export const contactActionSchema = z.object({
  name: z.string().min(2),
  email: z.string().optional(),
  phone: z.string().min(10),
  company: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(5),
  consentAccepted: z.literal(true),
});

export const contactMessageStatusSchema = z.enum([
  "NOVO",
  "EM_ANALISE",
  "RESPONDIDO",
  "ARQUIVADO",
]);

const examCategoryEnum = z.enum([
  "CLINICO_OCUPACIONAL",
  "COMPLEMENTAR",
  "LABORATORIAL",
  "IMAGEM",
  "TOXICOLOGICO",
  "AVALIACAO_ESPECIALIZADA",
  "OUTRO",
]);

const examStatusEnum = z.enum(["ATIVO", "INATIVO", "EM_REVISAO"]);

const examPreparationTypeEnum = z.enum([
  "SEM_PREPARO",
  "PREPARO_NECESSARIO",
  "JEJUM_NECESSARIO",
  "ATENCAO_ESPECIAL",
  "VERIFICAR_EXAME",
  "ORIENTACAO_ESPECIFICA",
]);

const examDeadlineTypeEnum = z.enum([
  "NO_DIA",
  "DIAS_UTEIS",
  "CONFORME_AGENDAMENTO",
  "CONFORME_LABORATORIO",
]);

export const examFormSchema = z.object({
  name: z.string().min(2, "Nome do exame obrigatório"),
  category: examCategoryEnum,
  shortDescription: z.string().optional(),
  status: examStatusEnum.default("ATIVO"),
  showOnWebsite: z.boolean().default(false),
  availableOnPublicForm: z.boolean().default(true),
  availableOnCompanyPortal: z.boolean().default(true),
  preparationType: examPreparationTypeEnum.default("SEM_PREPARO"),
  preparationBefore: z.string().optional(),
  instructionsOnDay: z.string().optional(),
  averageDeadline: z.string().optional(),
  deadlineType: examDeadlineTypeEnum.optional().nullable(),
  observations: z.string().optional(),
  whenToNotifyClinic: z.string().optional(),
  requiresAppointment: z.boolean().default(false),
  requiresProfessional: z.boolean().default(false),
  requiresAttachment: z.boolean().default(false),
  displayOrder: z.coerce.number().int().optional().nullable(),
  internalTags: z.string().optional(),
  publishOnSave: z.boolean().optional(),
});

export type ExamFormData = z.infer<typeof examFormSchema>;

export const examStatusToggleSchema = z.object({
  examId: z.string().min(1),
  status: examStatusEnum,
});
