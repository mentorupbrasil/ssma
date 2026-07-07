"use server";

import { prisma } from "@/lib/prisma";
import { referralFormSchema } from "@/schemas";
import { createAuditLog, generateProtocol } from "@/lib/server";
import { ExamCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function submitReferral(data: unknown) {
  const parsed = referralFormSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: "Dados inválidos. Verifique o formulário." };
  }

  const d = parsed.data;
  const doc = d.companyDocument;

  try {
    const protocol = await generateProtocol();

    let company = await prisma.company.findFirst({
      where: { cnpj: doc },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          legalName: d.companyName,
          tradeName: d.companyName,
          cnpj: doc,
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
        source: "online",
        exams: { create: examItems },
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Referral",
      entityId: referral.id,
      details: `Encaminhamento online ${protocol}`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/encaminhamentos");

    return { success: true as const, protocol };
  } catch (error) {
    console.error("submitReferral error:", error);
    return { success: false as const, error: "Erro ao enviar encaminhamento. Tente novamente." };
  }
}

export async function submitContact(data: {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  message?: string;
  type?: "CONTATO" | "ORCAMENTO";
}) {
  try {
    await prisma.lead.create({
      data: {
        type: data.type === "ORCAMENTO" ? "ORCAMENTO" : "CONTATO",
        status: "NOVO",
        name: data.name,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        message: data.message,
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Lead",
      details: `Contato de ${data.name}`,
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Erro ao enviar mensagem." };
  }
}

export async function updateReferralStatus(id: string, status: string) {
  try {
    await prisma.referral.update({
      where: { id },
      data: { status: status as never },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Referral",
      entityId: id,
      details: `Status alterado para ${status}`,
    });

    revalidatePath("/dashboard/encaminhamentos");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Erro ao atualizar status." };
  }
}

export async function updateLeadStatus(id: string, status: string) {
  try {
    await prisma.lead.update({
      where: { id },
      data: { status: status as never },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Lead",
      entityId: id,
      details: `Status alterado para ${status}`,
    });

    revalidatePath("/dashboard/orcamentos");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Erro ao atualizar." };
  }
}

export async function createCompany(data: {
  legalName: string;
  tradeName?: string;
  cnpj: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  responsibleName?: string;
  notes?: string;
}) {
  try {
    const company = await prisma.company.create({
      data: {
        ...data,
        cnpj: data.cnpj.replace(/\D/g, ""),
        status: "ACTIVE",
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Company",
      entityId: company.id,
    });

    revalidatePath("/dashboard/empresas");
    return { success: true as const, id: company.id };
  } catch {
    return { success: false as const, error: "Erro ao cadastrar empresa." };
  }
}

export async function createPatient(data: {
  fullName: string;
  cpf: string;
  rg?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  email?: string;
  companyId?: string;
  jobTitle?: string;
  department?: string;
  notes?: string;
}) {
  try {
    const patient = await prisma.patient.create({
      data: {
        fullName: data.fullName,
        cpf: data.cpf.replace(/\D/g, ""),
        rg: data.rg,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        companyId: data.companyId || undefined,
        jobTitle: data.jobTitle,
        department: data.department,
        notes: data.notes,
        status: "ACTIVE",
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Patient",
      entityId: patient.id,
    });

    revalidatePath("/dashboard/pacientes");
    return { success: true as const, id: patient.id };
  } catch {
    return { success: false as const, error: "Erro ao cadastrar paciente." };
  }
}
