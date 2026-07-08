"use server";

import { prisma } from "@/lib/prisma";
import {
  referralFormSchema,
  companySchema,
  patientSchema,
  referralStatusSchema,
  leadStatusSchema,
  preReferralFormSchema,
  preReferralStatusSchema,
  contactActionSchema,
  contactMessageStatusSchema,
  appointmentSchema,
} from "@/schemas";
import { createAuditLog, generateProtocol } from "@/lib/server";
import { ExamCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  requireSession,
  requirePermission,
  getCompanyFilter,
  assertReferralAccess,
  actionError,
  isPrismaUniqueError,
  isEmpresaUser,
} from "@/lib/authz";

type ActionResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

export async function submitReferral(
  data: unknown,
  options?: { source?: "online" | "dashboard" }
): Promise<ActionResult<{ protocol: string }>> {
  const parsed = referralFormSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  const d = parsed.data;
  let source: "online" | "portal" | "dashboard" = options?.source ?? "online";
  let sessionUserId: string | undefined;

  if (source !== "online") {
    try {
      const session = await requirePermission("referrals.manage");
      sessionUserId = session.user.id;
      source = isEmpresaUser(session) ? "portal" : "dashboard";

      if (isEmpresaUser(session) && session.user.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: session.user.companyId },
        });
        if (!company || company.cnpj !== d.companyDocument) {
          return {
            success: false,
            error: "Empresa do encaminhamento deve ser a sua empresa vinculada.",
          };
        }
      }
    } catch (e) {
      return { success: false, error: actionError(e, "Não autorizado.") };
    }
  }

  try {
    const protocol = await generateProtocol();

    let company = await prisma.company.findFirst({
      where: { cnpj: d.companyDocument },
    });

    if (!company) {
      if (source !== "online") {
        return {
          success: false,
          error: "Empresa não cadastrada. Cadastre a empresa antes do encaminhamento interno.",
        };
      }
      company = await prisma.company.create({
        data: {
          legalName: d.companyName,
          tradeName: d.companyName,
          cnpj: d.companyDocument,
          email: d.companyEmail,
          phone: d.companyPhone,
          responsibleName: d.authorizerName,
          status: "ACTIVE",
        },
      });
    }

    let patient = await prisma.patient.findUnique({
      where: { cpf: d.patientCpf },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          fullName: d.patientName,
          cpf: d.patientCpf,
          rg: d.patientRg,
          birthDate: new Date(d.birthDate),
          gender: d.gender,
          phone: d.patientPhone,
          jobTitle: d.jobTitle,
          department: d.department,
          companyId: company.id,
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          fullName: d.patientName,
          companyId: company.id,
          jobTitle: d.jobTitle,
          department: d.department,
          phone: d.patientPhone ?? patient.phone,
        },
      });
    }

    const examItems = [
      ...d.complementaryExams.map((name) => ({
        examName: name,
        category: ExamCategory.COMPLEMENTAR,
      })),
      ...d.labExams.map((name) => ({
        examName: name,
        category: ExamCategory.LABORATORIAL,
      })),
    ];

    const referral = await prisma.referral.create({
      data: {
        protocol,
        companyId: company.id,
        patientId: patient.id,
        clinicalExamType: d.clinicalExamType,
        status: "NOVO",
        authorizerName: d.authorizerName,
        companyPhone: d.companyPhone,
        companyEmail: d.companyEmail,
        consentAccepted: true,
        source,
        exams: { create: examItems },
      },
    });

    await createAuditLog({
      userId: sessionUserId,
      action: "CREATE",
      entity: "Referral",
      entityId: referral.id,
      details: `Encaminhamento ${source} ${protocol}`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/encaminhamentos");

    return { success: true, protocol };
  } catch (error) {
    console.error("submitReferral error:", error);
    if (isPrismaUniqueError(error)) {
      return { success: false, error: "CPF ou CNPJ já cadastrado com dados conflitantes." };
    }
    return { success: false, error: "Erro ao enviar encaminhamento. Tente novamente." };
  }
}

export async function submitPreReferral(
  data: unknown
): Promise<
  ActionResult<{
    protocol: string;
    companyName: string;
    employeeName: string;
    clinicalExamType: string;
  }>
> {
  const parsed = preReferralFormSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  const d = parsed.data;

  const normalizeDocument = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
  };

  const normalizeEmail = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  try {
    const protocol = await generateProtocol();

    await prisma.publicReferralRequest.create({
      data: {
        protocol,
        companyName: d.companyName,
        companyDocument: normalizeDocument(d.companyDocument),
        responsibleName: d.responsibleName,
        whatsapp: d.whatsapp.replace(/\D/g, ""),
        email: normalizeEmail(d.email),
        employeeName: d.employeeName,
        employeeDocument: normalizeDocument(d.employeeDocument),
        employeeRole: d.employeeRole,
        clinicalExamType: d.clinicalExamType,
        examSelectionMode: d.examSelectionMode,
        selectedExams:
          d.examSelectionMode === "SELECIONAR" ? d.selectedExams : [],
        notes: d.notes?.trim() || null,
        consentAccepted: true,
        status: "NOVO",
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "PublicReferralRequest",
      details: `Pré-encaminhamento público ${protocol}`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/pre-encaminhamentos");
    revalidatePath("/dashboard/encaminhamentos");

    return {
      success: true,
      protocol,
      companyName: d.companyName,
      employeeName: d.employeeName,
      clinicalExamType: d.clinicalExamType,
    };
  } catch (error) {
    console.error("submitPreReferral error:", error);
    return { success: false, error: "Erro ao enviar pré-encaminhamento. Tente novamente." };
  }
}

export async function updatePreReferralStatus(
  id: string,
  status: unknown
): Promise<ActionResult> {
  const parsedStatus = preReferralStatusSchema.safeParse(status);
  if (!parsedStatus.success) {
    return { success: false, error: "Status inválido." };
  }

  try {
    const session = await requirePermission("referrals.manage");

    await prisma.publicReferralRequest.update({
      where: { id },
      data: { status: parsedStatus.data },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "PublicReferralRequest",
      entityId: id,
      details: `Status alterado para ${parsedStatus.data}`,
    });

    revalidatePath("/dashboard/pre-encaminhamentos");
    revalidatePath(`/dashboard/pre-encaminhamentos/${id}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (e) {
    return { success: false, error: actionError(e, "Não autorizado.") };
  }
}

export async function submitContactMessage(data: unknown): Promise<ActionResult> {
  const parsed = contactActionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  const d = parsed.data;
  const email = d.email?.trim() || null;
  const company = d.company?.trim() || null;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "E-mail inválido." };
  }

  try {
    await prisma.contactMessage.create({
      data: {
        name: d.name,
        email,
        phone: d.phone,
        company,
        subject: d.subject,
        message: d.message,
        consentAccepted: true,
        source: "site_contato",
        status: "NOVO",
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "ContactMessage",
      details: `Contato: ${d.name} — ${d.subject}`,
    });

    revalidatePath("/dashboard/contatos");
    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (error) {
    console.error("submitContactMessage error:", error);
    return { success: false, error: "Erro ao enviar mensagem." };
  }
}

/** @deprecated Use submitContactMessage */
export async function submitContact(data: unknown): Promise<ActionResult> {
  return submitContactMessage(data);
}

export async function updateContactMessageStatus(
  id: string,
  status: unknown
): Promise<ActionResult> {
  const parsedStatus = contactMessageStatusSchema.safeParse(status);
  if (!parsedStatus.success) {
    return { success: false, error: "Status inválido." };
  }

  try {
    const session = await requirePermission("leads.manage");

    await prisma.contactMessage.update({
      where: { id },
      data: { status: parsedStatus.data },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "ContactMessage",
      entityId: id,
      details: `Status alterado para ${parsedStatus.data}`,
    });

    revalidatePath("/dashboard/contatos");
    revalidatePath(`/dashboard/contatos/${id}`);

    return { success: true };
  } catch (e) {
    return { success: false, error: actionError(e, "Não autorizado.") };
  }
}

export async function updateReferralStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  const statusParsed = referralStatusSchema.safeParse(status);
  if (!statusParsed.success) {
    return { success: false, error: "Status inválido." };
  }

  try {
    const session = await requirePermission("referrals.manage");
    if (session.user.role === "EMPRESA") {
      throw new Error("FORBIDDEN");
    }
    await assertReferralAccess(session, id);

    await prisma.referral.update({
      where: { id },
      data: { status: statusParsed.data },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Referral",
      entityId: id,
      details: `Status alterado para ${statusParsed.data}`,
    });

    revalidatePath("/dashboard/encaminhamentos");
    revalidatePath(`/dashboard/encaminhamentos/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao atualizar status.") };
  }
}

export async function updateLeadStatus(id: string, status: string): Promise<ActionResult> {
  const statusParsed = leadStatusSchema.safeParse(status);
  if (!statusParsed.success) {
    return { success: false, error: "Status inválido." };
  }

  try {
    const session = await requirePermission("leads.manage");

    await prisma.lead.update({
      where: { id },
      data: { status: statusParsed.data },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Lead",
      entityId: id,
      details: `Status alterado para ${statusParsed.data}`,
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao atualizar.") };
  }
}

export async function createCompany(data: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = companySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  try {
    const session = await requirePermission("companies.manage");

    const company = await prisma.company.create({
      data: {
        ...parsed.data,
        cnpj: parsed.data.cnpj,
        status: "ACTIVE",
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Company",
      entityId: company.id,
    });

    revalidatePath("/dashboard/empresas");
    return { success: true, id: company.id };
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return { success: false, error: "CNPJ já cadastrado." };
    }
    return { success: false, error: actionError(error, "Erro ao cadastrar empresa.") };
  }
}

export async function createPatient(data: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = patientSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  try {
    const session = await requirePermission("patients.manage");
    const d = parsed.data;

    let companyId = d.companyId || undefined;
    if (isEmpresaUser(session)) {
      if (!session.user.companyId) {
        return { success: false, error: "Usuário empresa sem vínculo. Contate o suporte." };
      }
      companyId = session.user.companyId;
    }

    const patient = await prisma.patient.create({
      data: {
        fullName: d.fullName,
        cpf: d.cpf,
        rg: d.rg,
        birthDate: d.birthDate ? new Date(d.birthDate) : undefined,
        gender: d.gender,
        phone: d.phone,
        email: d.email || undefined,
        companyId,
        jobTitle: d.jobTitle,
        department: d.department,
        notes: d.notes,
        status: "ACTIVE",
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Patient",
      entityId: patient.id,
    });

    revalidatePath("/dashboard/pacientes");
    return { success: true, id: patient.id };
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return { success: false, error: "CPF já cadastrado." };
    }
    return { success: false, error: actionError(error, "Erro ao cadastrar paciente.") };
  }
}

export async function createAppointment(data: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = appointmentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  try {
    const session = await requirePermission("appointments.manage");
    const d = parsed.data;

    const patient = await prisma.patient.findUnique({
      where: { id: d.patientId },
      select: { companyId: true, fullName: true },
    });
    if (!patient) {
      return { success: false, error: "Paciente não encontrado." };
    }

    if (isEmpresaUser(session) && patient.companyId !== session.user.companyId) {
      return { success: false, error: "Paciente não pertence à sua empresa." };
    }

    const companyId = d.companyId ?? patient.companyId ?? undefined;

    if (d.referralId) {
      await assertReferralAccess(session, d.referralId);
    }

    const appointment = await prisma.appointment.create({
      data: {
        title: d.title,
        scheduledAt: new Date(d.scheduledAt),
        status: d.status,
        type: d.type,
        notes: d.notes,
        patientId: d.patientId,
        companyId,
        referralId: d.referralId || undefined,
      },
    });

    if (d.referralId) {
      await prisma.referral.update({
        where: { id: d.referralId },
        data: { status: "AGENDADO" },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Appointment",
      entityId: appointment.id,
      details: `Agendamento: ${d.title}`,
    });

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard");
    if (d.referralId) {
      revalidatePath("/dashboard/encaminhamentos");
      revalidatePath(`/dashboard/encaminhamentos/${d.referralId}`);
    }

    return { success: true, id: appointment.id };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao criar agendamento.") };
  }
}

export async function getEmpresaPrefill() {
  try {
    const session = await requirePermission("referrals.manage");
    if (!isEmpresaUser(session) || !session.user.companyId) {
      return null;
    }
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    });
    if (!company) return null;
    return {
      companyName: company.tradeName ?? company.legalName,
      companyDocument: company.cnpj,
      companyPhone: company.phone ?? "",
      companyEmail: company.email ?? "",
      authorizerName: company.responsibleName ?? session.user.name,
    };
  } catch {
    return null;
  }
}

export async function getAppointmentFormData() {
  try {
    const session = await requirePermission("appointments.manage");
    const companyFilter = getCompanyFilter(session);

    const [patients, companies, referrals] = await Promise.all([
      prisma.patient.findMany({
        where: { ...companyFilter, status: "ACTIVE" },
        select: { id: true, fullName: true, companyId: true },
        orderBy: { fullName: "asc" },
        take: 200,
      }),
      prisma.company.findMany({
        where: companyFilter.companyId
          ? { id: companyFilter.companyId, status: "ACTIVE" }
          : { status: "ACTIVE" },
        select: { id: true, legalName: true, tradeName: true },
        orderBy: { legalName: "asc" },
        take: 200,
      }),
      prisma.referral.findMany({
        where: {
          ...companyFilter,
          status: { in: ["NOVO", "EM_ANALISE", "AGUARDANDO_AGENDAMENTO"] },
        },
        select: { id: true, protocol: true, patientId: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    return { patients, companies, referrals };
  } catch {
    return { patients: [], companies: [], referrals: [] };
  }
}
