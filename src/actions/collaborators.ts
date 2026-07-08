"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PatientHistoryAction, PatientStatus } from "@prisma/client";
import {
  requirePermission,
  assertPatientAccess,
  actionError,
  isPrismaUniqueError,
  isEmpresaUser,
  getCompanyFilter,
} from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import type { CollaboratorDetailSerialized } from "@/lib/collaborators";
import { maskCpf, PATIENT_HISTORY_ACTION_LABELS } from "@/lib/collaborators";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { createCollaboratorSchema, updateCollaboratorSchema } from "@/schemas";

type ActionResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

const OPEN_REFERRAL = [
  "NOVO",
  "EM_ANALISE",
  "AGUARDANDO_AGENDAMENTO",
  "AGENDADO",
  "EM_ATENDIMENTO",
  "AGUARDANDO_RESULTADO",
  "AGUARDANDO_DOCUMENTO",
  "ASO_DISPONIVEL",
] as const;

async function recordPatientHistory(
  patientId: string,
  action: PatientHistoryAction,
  userId: string,
  notes?: string
) {
  await prisma.patientHistory.create({
    data: {
      patientId,
      action,
      notes: notes?.trim() || null,
      performedByUserId: userId,
    },
  });
}

export async function getCollaboratorDetail(
  id: string
): Promise<ActionResult<{ collaborator: CollaboratorDetailSerialized }>> {
  try {
    const session = await requirePermission("patients.manage");
    await assertPatientAccess(session, id);

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        company: true,
        referrals: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { company: true, exams: { include: { exam: true } } },
        },
        appointments: {
          orderBy: { scheduledAt: "desc" },
          take: 30,
          include: { company: true },
        },
        documents: { orderBy: { createdAt: "desc" }, take: 50 },
        history: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { performedBy: { select: { name: true } } },
        },
      },
    });

    if (!patient) return { success: false, error: "Colaborador não encontrado." };

    const now = new Date();
    const [openReferrals, upcomingAppointments, availableDocs, lastRef] = await Promise.all([
      prisma.referral.count({
        where: { patientId: id, status: { in: [...OPEN_REFERRAL] } },
      }),
      prisma.appointment.count({
        where: {
          patientId: id,
          scheduledAt: { gte: now },
          status: { in: ["AGENDADO", "CONFIRMADO", "EM_ATENDIMENTO"] },
        },
      }),
      prisma.document.count({
        where: { patientId: id, status: { in: ["CONCLUIDO", "ENTREGUE", "EM_DIA"] } },
      }),
      prisma.referral.findFirst({
        where: { patientId: id },
        orderBy: { createdAt: "desc" },
        select: { clinicalExamType: true, createdAt: true },
      }),
    ]);

    const clinicalExams: CollaboratorDetailSerialized["clinicalExams"] = [];
    const complementaryExams: CollaboratorDetailSerialized["complementaryExams"] = [];

    for (const ref of patient.referrals) {
      clinicalExams.push({
        id: ref.id,
        name: CLINICAL_EXAM_LABELS[ref.clinicalExamType] ?? ref.clinicalExamType,
        date: ref.createdAt.toISOString(),
        status: ref.status,
        protocol: ref.protocol,
      });
      for (const re of ref.exams) {
        complementaryExams.push({
          id: re.id,
          name: re.examName,
          date: re.createdAt.toISOString(),
          status: re.status,
          protocol: ref.protocol,
        });
      }
    }

    const pendingExams = complementaryExams.filter((e) =>
      ["PENDENTE", "AGENDADO"].includes(e.status)
    ).length;

    const collaborator: CollaboratorDetailSerialized = {
      id: patient.id,
      fullName: patient.fullName,
      cpf: patient.cpf,
      cpfMasked: maskCpf(patient.cpf),
      rg: patient.rg,
      birthDate: patient.birthDate?.toISOString() ?? null,
      phone: patient.phone,
      email: patient.email,
      jobTitle: patient.jobTitle,
      department: patient.department,
      admissionDate: patient.admissionDate?.toISOString() ?? null,
      nextPeriodicDate: patient.nextPeriodicDate?.toISOString() ?? null,
      status: patient.status,
      notes: patient.notes,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
      company: patient.company
        ? {
            id: patient.company.id,
            legalName: patient.company.legalName,
            tradeName: patient.company.tradeName,
          }
        : null,
      stats: {
        openReferrals,
        upcomingAppointments,
        availableDocuments: availableDocs,
        pendingExams,
        lastExamLabel: lastRef
          ? CLINICAL_EXAM_LABELS[lastRef.clinicalExamType]
          : null,
        lastExamDate: lastRef?.createdAt.toISOString() ?? null,
      },
      referrals: patient.referrals.map((r) => ({
        id: r.id,
        protocol: r.protocol,
        companyName: r.company.tradeName ?? r.company.legalName,
        clinicalExamType: r.clinicalExamType,
        createdAt: r.createdAt.toISOString(),
        scheduledAt: r.scheduledAt?.toISOString() ?? null,
        status: r.status,
      })),
      appointments: patient.appointments.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt.toISOString(),
        clinicalExamType: a.clinicalExamType,
        companyName: a.company ? (a.company.tradeName ?? a.company.legalName) : null,
        status: a.status,
        protocol: a.protocol,
      })),
      clinicalExams,
      complementaryExams,
      documents: patient.documents.map((d) => ({
        id: d.id,
        title: d.title,
        type: d.type,
        status: d.status,
        validUntil: d.validUntil?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
        fileUrl: d.fileUrl,
      })),
      history: patient.history.map((h) => ({
        id: h.id,
        action: h.action,
        notes: h.notes,
        performedByName: h.performedBy?.name ?? null,
        createdAt: h.createdAt.toISOString(),
      })),
    };

    return { success: true, collaborator };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao carregar colaborador.") };
  }
}

export async function createCollaboratorFull(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = createCollaboratorSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  try {
    const session = await requirePermission("patients.manage");
    const d = parsed.data;
    const cpfDigits = d.cpf.replace(/\D/g, "");

    const existing = await prisma.patient.findUnique({ where: { cpf: cpfDigits } });
    if (existing) {
      return {
        success: false,
        error: "Já existe um colaborador cadastrado com este CPF.",
      };
    }

    let companyId = d.companyId;
    if (isEmpresaUser(session)) {
      if (!session.user.companyId) {
        return { success: false, error: "Usuário empresa sem vínculo." };
      }
      companyId = session.user.companyId;
    }

    if (!companyId) {
      return { success: false, error: "Empresa obrigatória." };
    }

    const patient = await prisma.$transaction(async (tx) => {
      const created = await tx.patient.create({
        data: {
          fullName: d.fullName.trim(),
          cpf: cpfDigits,
          birthDate: d.birthDate ? new Date(d.birthDate) : undefined,
          phone: d.phone?.trim() || null,
          email: d.email?.trim() || null,
          companyId,
          jobTitle: d.jobTitle.trim(),
          department: d.department?.trim() || null,
          admissionDate: d.admissionDate ? new Date(d.admissionDate) : undefined,
          nextPeriodicDate: d.nextPeriodicDate ? new Date(d.nextPeriodicDate) : undefined,
          status: d.status ?? "ATIVO",
          notes: d.notes?.trim() || null,
        },
      });

      await tx.patientHistory.create({
        data: {
          patientId: created.id,
          action: "CREATED",
          notes: "Colaborador cadastrado",
          performedByUserId: session.user.id,
        },
      });

      if (companyId) {
        await tx.patientHistory.create({
          data: {
            patientId: created.id,
            action: "COMPANY_LINKED",
            notes: "Vínculo empresarial registrado",
            performedByUserId: session.user.id,
          },
        });
      }

      return created;
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Patient",
      entityId: patient.id,
      details: patient.fullName,
    });

    revalidatePath("/dashboard/colaboradores");
    revalidatePath("/dashboard/empresas");
    return { success: true, id: patient.id };
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return { success: false, error: "Já existe um colaborador cadastrado com este CPF." };
    }
    return { success: false, error: actionError(error, "Erro ao cadastrar colaborador.") };
  }
}

export async function updateCollaborator(id: string, data: unknown): Promise<ActionResult> {
  const parsed = updateCollaboratorSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  try {
    const session = await requirePermission("patients.manage");
    await assertPatientAccess(session, id);
    const d = parsed.data;

    if (d.cpf) {
      const digits = d.cpf.replace(/\D/g, "");
      const dup = await prisma.patient.findFirst({
        where: { cpf: digits, NOT: { id } },
      });
      if (dup) {
        return { success: false, error: "Já existe um colaborador cadastrado com este CPF." };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.patient.update({
        where: { id },
        data: {
          ...(d.fullName !== undefined && { fullName: d.fullName.trim() }),
          ...(d.cpf !== undefined && { cpf: d.cpf.replace(/\D/g, "") }),
          ...(d.birthDate !== undefined && {
            birthDate: d.birthDate ? new Date(d.birthDate) : null,
          }),
          ...(d.phone !== undefined && { phone: d.phone?.trim() || null }),
          ...(d.email !== undefined && { email: d.email?.trim() || null }),
          ...(d.companyId !== undefined && { companyId: d.companyId }),
          ...(d.jobTitle !== undefined && { jobTitle: d.jobTitle.trim() }),
          ...(d.department !== undefined && { department: d.department?.trim() || null }),
          ...(d.admissionDate !== undefined && {
            admissionDate: d.admissionDate ? new Date(d.admissionDate) : null,
          }),
          ...(d.nextPeriodicDate !== undefined && {
            nextPeriodicDate: d.nextPeriodicDate ? new Date(d.nextPeriodicDate) : null,
          }),
          ...(d.status !== undefined && { status: d.status as PatientStatus }),
          ...(d.notes !== undefined && { notes: d.notes?.trim() || null }),
        },
      });

      await tx.patientHistory.create({
        data: {
          patientId: id,
          action: "UPDATED",
          notes: "Dados do colaborador atualizados",
          performedByUserId: session.user.id,
        },
      });
    });

    revalidatePath("/dashboard/colaboradores");
    revalidatePath(`/dashboard/colaboradores/${id}`);
    return { success: true };
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return { success: false, error: "Já existe um colaborador cadastrado com este CPF." };
    }
    return { success: false, error: actionError(error, "Erro ao atualizar colaborador.") };
  }
}

export async function getCollaboratorFormCompanies() {
  try {
    const session = await requirePermission("patients.manage");
    const companyFilter = getCompanyFilter(session);
    const companies = await prisma.company.findMany({
      where: companyFilter.companyId
        ? { id: companyFilter.companyId, status: "ATIVA" }
        : { status: "ATIVA" },
      select: { id: true, legalName: true, tradeName: true },
      orderBy: { legalName: "asc" },
      take: 300,
    });
    return { success: true as const, companies };
  } catch {
    return { success: false as const, error: "Erro ao carregar empresas." };
  }
}

export { PATIENT_HISTORY_ACTION_LABELS };
