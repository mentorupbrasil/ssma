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
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  companyName: z.string().optional(),
  message: z.string().min(10, "Mensagem muito curta"),
  consent: z.literal(true, { message: "Consentimento obrigatório" }),
});

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
