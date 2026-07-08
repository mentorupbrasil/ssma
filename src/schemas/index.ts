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
  "CONVERTIDO",
  "CANCELADO",
]);

export const companySchema = z.object({
  legalName: z.string().min(2),
  tradeName: z.string().optional(),
  cnpj: cnpjSchema,
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  responsibleName: z.string().optional(),
  notes: z.string().optional(),
});

export const patientSchema = z.object({
  fullName: z.string().min(2),
  cpf: cpfSchema,
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  companyId: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  notes: z.string().optional(),
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
  "CONCLUIDO",
  "CANCELADO",
]);

export const leadStatusSchema = z.enum([
  "NOVO",
  "EM_CONTATO",
  "PROPOSTA_ENVIADA",
  "FECHADO",
  "PERDIDO",
]);

export const appointmentStatusSchema = z.enum([
  "AGENDADO",
  "CONFIRMADO",
  "REALIZADO",
  "FALTOU",
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
