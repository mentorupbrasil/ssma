"use server";

import { prisma } from "@/lib/prisma";
import { referralStatusSchema } from "@/schemas";
import { createAuditLog, generateProtocol } from "@/lib/server";
import { revalidatePath } from "next/cache";
import {
  requirePermission,
  assertReferralAccess,
  actionError,
  isEmpresaUser,
  isPrismaUniqueError,
} from "@/lib/authz";
import type { Prisma, ReferralStatus, ClinicalExamType, ExamCategory } from "@prisma/client";
import type { ReferralListFilters } from "@/lib/referrals";
import {
  buildReferralWhere,
  serializeReferralDetail,
  type ReferralListItem,
} from "@/lib/referrals";

type ActionResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

const REFERRAL_DETAIL_INCLUDE = {
  company: true,
  patient: true,
  assignedTo: true,
  exams: true,
  appointments: { orderBy: { scheduledAt: "desc" as const } },
  referralDocuments: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" as const } },
  documents: true,
  statusHistory: {
    include: { changedBy: true },
    orderBy: { createdAt: "desc" as const },
  },
  preReferral: true,
} satisfies Prisma.ReferralInclude;

export async function getReferralStatusCounts(companyId?: string) {
  try {
    const session = await requirePermission("referrals.manage");
    const scopeCompanyId =
      companyId ?? (isEmpresaUser(session) ? session.user.companyId ?? undefined : undefined);

    const baseWhere: Prisma.ReferralWhereInput = scopeCompanyId
      ? { companyId: scopeCompanyId }
      : {};

    const statuses: ReferralStatus[] = [
      "NOVO",
      "EM_ANALISE",
      "AGENDADO",
      "EM_ATENDIMENTO",
      "AGUARDANDO_DOCUMENTO",
      "CONCLUIDO",
    ];

    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await prisma.referral.count({ where: { ...baseWhere, status } }),
      }))
    );

    return {
      success: true as const,
      counts: Object.fromEntries(counts.map((c) => [c.status, c.count])) as Record<
        ReferralStatus,
        number
      >,
    };
  } catch (e) {
    return { success: false as const, error: actionError(e, "Erro ao carregar resumo.") };
  }
}

export async function listReferrals(filters: ReferralListFilters = {}) {
  try {
    const session = await requirePermission("referrals.manage");
    const companyScope = isEmpresaUser(session) ? session.user.companyId ?? undefined : undefined;
    const where = buildReferralWhere(filters, companyScope);

    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(50, Math.max(10, filters.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const sortBy = filters.sortBy ?? "createdAt";
    const sortDir = filters.sortDir ?? "desc";
    const orderBy: Prisma.ReferralOrderByWithRelationInput =
      sortBy === "company"
        ? { company: { legalName: sortDir } }
        : sortBy === "status"
          ? { status: sortDir }
          : { createdAt: sortDir };

    const [total, referrals] = await Promise.all([
      prisma.referral.count({ where }),
      prisma.referral.findMany({
        where,
        include: { company: true, patient: true, assignedTo: true },
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    const items: ReferralListItem[] = referrals.map((r) => ({
      id: r.id,
      protocol: r.protocol,
      companyName: r.company.tradeName ?? r.company.legalName,
      employeeName: r.patient.fullName,
      jobTitle: r.patient.jobTitle,
      clinicalExamType: r.clinicalExamType,
      requestedDate: r.requestedDate.toISOString(),
      scheduledAt: r.scheduledAt?.toISOString() ?? null,
      status: r.status,
      responsibleName: r.assignedTo?.name ?? null,
      companyPhone: r.companyPhone ?? r.company.phone,
      companyWhatsapp: r.company.whatsapp ?? r.company.phone,
    }));

    return {
      success: true as const,
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (e) {
    return { success: false as const, error: actionError(e, "Erro ao carregar encaminhamentos.") };
  }
}

export async function getReferralDetail(id: string) {
  try {
    const session = await requirePermission("referrals.manage");
    await assertReferralAccess(session, id);

    const referral = await prisma.referral.findUnique({
      where: { id },
      include: REFERRAL_DETAIL_INCLUDE,
    });

    if (!referral) {
      return { success: false as const, error: "Encaminhamento não encontrado." };
    }

    return { success: true as const, referral: serializeReferralDetail(referral) };
  } catch (e) {
    return { success: false as const, error: actionError(e, "Não autorizado.") };
  }
}

export async function updateReferralStatusWithNotes(
  id: string,
  status: unknown,
  notes?: string
): Promise<ActionResult> {
  const statusParsed = referralStatusSchema.safeParse(status);
  if (!statusParsed.success) {
    return { success: false, error: "Status inválido." };
  }

  try {
    const session = await requirePermission("referrals.manage");
    if (session.user.role === "EMPRESA" || session.user.role === "VISUALIZADOR") {
      throw new Error("FORBIDDEN");
    }
    await assertReferralAccess(session, id);

    const current = await prisma.referral.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) return { success: false, error: "Encaminhamento não encontrado." };

    if (current.status === statusParsed.data) {
      return { success: true };
    }

    await prisma.$transaction([
      prisma.referral.update({
        where: { id },
        data: { status: statusParsed.data },
      }),
      prisma.referralStatusHistory.create({
        data: {
          referralId: id,
          fromStatus: current.status,
          toStatus: statusParsed.data,
          notes: notes?.trim() || null,
          changedById: session.user.id,
        },
      }),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Referral",
      entityId: id,
      details: `Status: ${current.status} → ${statusParsed.data}${notes ? ` — ${notes}` : ""}`,
    });

    revalidatePath("/dashboard/encaminhamentos");
    revalidatePath(`/dashboard/encaminhamentos/${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao atualizar status.") };
  }
}

export async function scheduleReferralAppointment(
  referralId: string,
  data: { scheduledAt: string; notes?: string; professionalId?: string; roomName?: string },
  options?: { forceConflict?: boolean }
): Promise<ActionResult<{ id?: string }>> {
  const { createAppointmentFromReferral } = await import("@/actions/appointments");
  const result = await createAppointmentFromReferral(referralId, data, options);
  if (result.success) {
    revalidatePath("/dashboard/encaminhamentos");
    revalidatePath(`/dashboard/encaminhamentos/${referralId}`);
  }
  return result;
}

export async function attachReferralDocument(
  referralId: string,
  data: { type: string; fileName: string; fileUrl: string }
): Promise<ActionResult> {
  const validTypes = ["ASO", "GUIA", "LAUDO", "RESULTADO", "OUTRO"] as const;
  if (!validTypes.includes(data.type as (typeof validTypes)[number])) {
    return { success: false, error: "Tipo de documento inválido." };
  }

  try {
    const session = await requirePermission("referrals.manage");
    if (session.user.role === "EMPRESA") throw new Error("FORBIDDEN");
    await assertReferralAccess(session, referralId);

    const currentStatus = (
      await prisma.referral.findUnique({ where: { id: referralId }, select: { status: true } })
    )!.status;

    const newStatus = data.type === "ASO" ? "ASO_DISPONIVEL" : currentStatus;

    await prisma.$transaction([
      prisma.referralDocument.create({
        data: {
          referralId,
          type: data.type as (typeof validTypes)[number],
          fileName: data.fileName.trim(),
          fileUrl: data.fileUrl.trim(),
          uploadedById: session.user.id,
        },
      }),
      ...(newStatus !== currentStatus
        ? [
            prisma.referral.update({
              where: { id: referralId },
              data: { status: newStatus },
            }),
          ]
        : []),
      prisma.referralStatusHistory.create({
        data: {
          referralId,
          fromStatus: currentStatus,
          toStatus: newStatus,
          notes: `Documento anexado: ${data.fileName}`,
          changedById: session.user.id,
        },
      }),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "ReferralDocument",
      entityId: referralId,
      details: data.fileName,
    });

    revalidatePath("/dashboard/encaminhamentos");
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao anexar documento.") };
  }
}

export async function cancelReferralAppointment(
  referralId: string,
  appointmentId: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("referrals.manage");
    if (session.user.role === "EMPRESA") throw new Error("FORBIDDEN");
    await assertReferralAccess(session, referralId);

    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      select: { status: true },
    });
    if (!referral) return { success: false, error: "Encaminhamento não encontrado." };

    await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: { status: true },
      });

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELADO" },
      });

      await tx.appointmentHistory.create({
        data: {
          appointmentId,
          action: "CANCELLED",
          fromStatus: apt?.status,
          toStatus: "CANCELADO",
          notes: notes?.trim() || "Agendamento cancelado via encaminhamento",
          performedByUserId: session.user.id,
        },
      });

      await tx.referral.update({
        where: { id: referralId },
        data: { scheduledAt: null, status: "AGUARDANDO_AGENDAMENTO" },
      });

      await tx.referralStatusHistory.create({
        data: {
          referralId,
          fromStatus: referral.status,
          toStatus: "AGUARDANDO_AGENDAMENTO",
          notes: notes?.trim() || "Agendamento cancelado",
          changedById: session.user.id,
        },
      });
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Appointment",
      entityId: appointmentId,
      details: "Agendamento cancelado",
    });

    revalidatePath("/dashboard/encaminhamentos");
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao cancelar agendamento.") };
  }
}

export async function deleteReferralDocument(
  referralId: string,
  documentId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("referrals.manage");
    if (session.user.role === "EMPRESA" || session.user.role === "VISUALIZADOR") {
      throw new Error("FORBIDDEN");
    }
    await assertReferralAccess(session, referralId);

    const doc = await prisma.referralDocument.findFirst({
      where: { id: documentId, referralId },
    });
    if (!doc) return { success: false, error: "Documento não encontrado." };

    await prisma.referralDocument.delete({ where: { id: documentId } });

    await prisma.referralStatusHistory.create({
      data: {
        referralId,
        toStatus: (
          await prisma.referral.findUnique({ where: { id: referralId }, select: { status: true } })
        )!.status,
        notes: `Documento removido: ${doc.fileName}`,
        changedById: session.user.id,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "ReferralDocument",
      entityId: documentId,
      details: doc.fileName,
    });

    revalidatePath("/dashboard/encaminhamentos");
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao remover documento.") };
  }
}

export async function convertPreReferralToReferral(
  preReferralId: string
): Promise<ActionResult<{ referralId: string; protocol: string }>> {
  const { convertPreReferralWithOptions } = await import("@/actions/pre-referrals");
  return convertPreReferralWithOptions(preReferralId, {});
}