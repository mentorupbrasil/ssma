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
import { resolvePublicClinicId } from "@/lib/scoped-db";
import { isQuoteRequestSubject } from "@/lib/commercial";
import { getRequestRateLimitKey, enforcePublicFormRateLimit } from "@/lib/rate-limit";
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
  let referralSource: "SITE" | "PORTAL" | "ADMIN" = "SITE";
  let sessionUserId: string | undefined;

  if (options?.source !== "online") {
    try {
      const session = await requirePermission("referrals.manage");
      sessionUserId = session.user.id;
      referralSource = isEmpresaUser(session) ? "PORTAL" : "ADMIN";

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
    if (options?.source === "online" || referralSource === "SITE") {
      const rateKey = await getRequestRateLimitKey("referral");
      enforcePublicFormRateLimit(rateKey);
    }

    const protocol = await generateProtocol();

    let company = await prisma.company.findFirst({
      where: { cnpj: d.companyDocument },
    });

    if (!company) {
      if (referralSource !== "SITE") {
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
          status: "ATIVA",
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
          status: "ATIVO",
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
        status: "PENDENTE" as const,
      })),
      ...d.labExams.map((name) => ({
        examName: name,
        category: ExamCategory.LABORATORIAL,
        status: "PENDENTE" as const,
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
        source: referralSource,
        assignedToId: sessionUserId,
        exams: { create: examItems },
        statusHistory: sessionUserId
          ? {
              create: {
                toStatus: "NOVO",
                notes: "Encaminhamento criado",
                changedById: sessionUserId,
              },
            }
          : {
              create: {
                toStatus: "NOVO",
                notes: "Encaminhamento criado pelo site",
              },
            },
      },
    });

    await createAuditLog({
      userId: sessionUserId,
      action: "CREATE",
      entity: "Referral",
      entityId: referral.id,
      details: `Encaminhamento ${referralSource} ${protocol}`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/encaminhamentos");

    return { success: true, protocol };
  } catch (error) {
    console.error("submitReferral error:", error);
    if (error instanceof Error && error.message.includes("Muitas tentativas")) {
      return { success: false, error: error.message };
    }
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
    const rateKey = await getRequestRateLimitKey("pre-referral");
    enforcePublicFormRateLimit(rateKey);

    const protocol = await generateProtocol();
    const clinicId = await resolvePublicClinicId();

    const created = await prisma.publicReferralRequest.create({
      data: {
        protocol,
        clinicId,
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
        source: "site_pre_referral",
      },
    });

    try {
      await prisma.preReferralHistory.create({
        data: {
          preReferralId: created.id,
          action: "RECEIVED",
          toStatus: "NOVO",
          notes: "Solicitação recebida pelo formulário público",
        },
      });
    } catch {
      // history table may not exist yet
    }

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
    if (error instanceof Error && error.message.includes("Muitas tentativas")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao enviar pré-encaminhamento. Tente novamente." };
  }
}

export async function updatePreReferralStatus(
  id: string,
  status: unknown,
  notes?: string
): Promise<ActionResult> {
  const { updatePreReferralStatusWithNotes } = await import("@/actions/pre-referrals");
  return updatePreReferralStatusWithNotes(id, status, notes);
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
    const rateKey = await getRequestRateLimitKey("contact");
    enforcePublicFormRateLimit(rateKey);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Limite de envios excedido.",
    };
  }

  try {
    const clinicId = await resolvePublicClinicId();
    const contact = await prisma.contactMessage.create({
      data: {
        clinicId,
        name: d.name,
        email,
        phone: d.phone,
        company,
        subject: d.subject,
        message: d.message,
        consentAccepted: true,
        source: "site_contato",
        status: "NOVO",
        serviceInterest: isQuoteRequestSubject(d.subject) ? d.subject : null,
      },
    });

    if (isQuoteRequestSubject(d.subject)) {
      const lead = await prisma.lead.create({
        data: {
          clinicId,
          type: "ORCAMENTO",
          status: "NOVO",
          name: d.name,
          email: email ?? undefined,
          phone: d.phone,
          companyName: company ?? undefined,
          serviceInterest: d.message?.trim() || d.subject,
          serviceTitle: d.subject,
          message: d.message,
          source: "site",
          contactMessageId: contact.id,
        },
      });
      await prisma.commercialHistory.create({
        data: {
          entityType: "LEAD",
          entityId: lead.id,
          action: "CREATED",
          notes: "Solicitação recebida pelo site",
        },
      });
    }

    await prisma.commercialHistory.create({
      data: {
        entityType: "CONTACT",
        entityId: contact.id,
        action: "CREATED",
        notes: d.subject,
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "ContactMessage",
      details: `Contato: ${d.name} — ${d.subject}`,
    });
  } catch (error) {
    console.error("contactMessage create failed, falling back to lead:", error);

    await prisma.lead.create({
      data: {
        type: "CONTATO",
        status: "NOVO",
        name: d.name,
        email: email ?? undefined,
        phone: d.phone,
        companyName: company ?? undefined,
        message: `Assunto: ${d.subject}\n\n${d.message}`,
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Lead",
      details: `Contato (fallback): ${d.name} — ${d.subject}`,
    });
  }

  revalidatePath("/dashboard/orcamentos");
  return { success: true };
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

    revalidatePath("/dashboard/orcamentos");
    revalidatePath(`/dashboard/orcamentos/mensagens/${id}`);

    return { success: true };
  } catch (e) {
    return { success: false, error: actionError(e, "Não autorizado.") };
  }
}

export async function updateReferralStatus(
  id: string,
  status: string,
  notes?: string
): Promise<ActionResult> {
  const { updateReferralStatusWithNotes } = await import("@/actions/referrals");
  return updateReferralStatusWithNotes(id, status, notes);
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
  const { createCompanyFull } = await import("@/actions/companies");
  return createCompanyFull(data);
}

export async function createPatient(data: unknown): Promise<ActionResult<{ id: string }>> {
  const { createCollaboratorFull } = await import("@/actions/collaborators");
  return createCollaboratorFull(data);
}

export async function createAppointment(data: unknown): Promise<ActionResult<{ id: string }>> {
  const { createAppointmentFull } = await import("@/actions/appointments");
  const parsed = appointmentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }
  const d = parsed.data;
  return createAppointmentFull({
    title: d.title,
    scheduledAt: d.scheduledAt,
    patientId: d.patientId,
    companyId: d.companyId,
    referralId: d.referralId,
    type: d.type,
    notes: d.notes,
  });
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
        where: { ...companyFilter, status: "ATIVO" },
        select: { id: true, fullName: true, companyId: true },
        orderBy: { fullName: "asc" },
        take: 200,
      }),
      prisma.company.findMany({
        where: companyFilter.companyId
          ? { id: companyFilter.companyId, status: "ATIVA" }
          : { status: "ATIVA" },
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
