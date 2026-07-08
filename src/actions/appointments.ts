"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AppointmentStatus, AppointmentHistoryAction } from "@prisma/client";
import {
  requirePermission,
  getCompanyFilter,
  assertReferralAccess,
  actionError,
  isEmpresaUser,
} from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import {
  appointmentIncludeDetail,
  serializeAppointmentDetail,
  type AppointmentDetailSerialized,
} from "@/lib/appointments";
import {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  addAppointmentNoteSchema,
} from "@/schemas";

type ActionResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

async function recordAppointmentHistory(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: {
    appointmentId: string;
    action: AppointmentHistoryAction;
    fromStatus?: AppointmentStatus | null;
    toStatus?: AppointmentStatus | null;
    notes?: string | null;
    performedByUserId: string;
  }
) {
  await tx.appointmentHistory.create({
    data: {
      appointmentId: params.appointmentId,
      action: params.action,
      fromStatus: params.fromStatus ?? undefined,
      toStatus: params.toStatus ?? undefined,
      notes: params.notes?.trim() || null,
      performedByUserId: params.performedByUserId,
    },
  });
}

async function syncReferralOnAppointmentChange(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  referralId: string,
  toStatus: AppointmentStatus,
  userId: string,
  notes: string
) {
  const referral = await tx.referral.findUnique({
    where: { id: referralId },
    select: { status: true },
  });
  if (!referral) return;

  let referralStatus = referral.status;
  if (toStatus === "AGENDADO" || toStatus === "CONFIRMADO") {
    referralStatus = "AGENDADO";
  } else if (toStatus === "EM_ATENDIMENTO") {
    referralStatus = "EM_ATENDIMENTO";
  } else if (toStatus === "CONCLUIDO") {
    referralStatus = "AGUARDANDO_DOCUMENTO";
  } else if (toStatus === "CANCELADO" || toStatus === "FALTOU") {
    referralStatus = "AGUARDANDO_AGENDAMENTO";
  }

  if (referralStatus !== referral.status) {
    await tx.referral.update({
      where: { id: referralId },
      data: { status: referralStatus },
    });
    await tx.referralStatusHistory.create({
      data: {
        referralId,
        fromStatus: referral.status,
        toStatus: referralStatus,
        notes,
        changedById: userId,
      },
    });
  }
}

export async function checkAppointmentConflict(params: {
  scheduledAt: string;
  professionalId?: string | null;
  roomName?: string | null;
  excludeId?: string;
}): Promise<ActionResult<{ hasConflict: boolean; conflicts: { id: string; title: string; scheduledAt: string }[] }>> {
  try {
    await requirePermission("appointments.manage");
    const at = new Date(params.scheduledAt);
    if (Number.isNaN(at.getTime())) {
      return { success: false, error: "Data/hora inválida." };
    }

    const windowStart = new Date(at.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(at.getTime() + 30 * 60 * 1000);

    const orConditions = [];
    if (params.professionalId) {
      orConditions.push({ professionalId: params.professionalId });
    }
    if (params.roomName?.trim()) {
      orConditions.push({ roomName: { equals: params.roomName.trim(), mode: "insensitive" as const } });
    }

    if (orConditions.length === 0) {
      return { success: true, hasConflict: false, conflicts: [] };
    }

    const conflicts = await prisma.appointment.findMany({
      where: {
        id: params.excludeId ? { not: params.excludeId } : undefined,
        status: { notIn: ["CANCELADO", "REAGENDADO", "FALTOU"] },
        scheduledAt: { gte: windowStart, lte: windowEnd },
        OR: orConditions,
      },
      select: { id: true, title: true, scheduledAt: true },
      take: 5,
    });

    return {
      success: true,
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map((c) => ({
        id: c.id,
        title: c.title,
        scheduledAt: c.scheduledAt.toISOString(),
      })),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao verificar conflito.") };
  }
}

export async function getAppointmentDetail(id: string): Promise<
  ActionResult<{ appointment: AppointmentDetailSerialized }>
> {
  try {
    const session = await requirePermission("appointments.manage");
    const companyFilter = getCompanyFilter(session);

    const appointment = await prisma.appointment.findFirst({
      where: { id, ...companyFilter },
      include: appointmentIncludeDetail,
    });

    if (!appointment) {
      return { success: false, error: "Agendamento não encontrado." };
    }

    if (session.user.role === "MEDICO" && appointment.professionalId !== session.user.id) {
      return { success: false, error: "Sem permissão para este agendamento." };
    }

    return { success: true, appointment: serializeAppointmentDetail(appointment) };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao carregar agendamento.") };
  }
}

export async function createAppointmentFull(
  data: unknown,
  options?: { forceConflict?: boolean }
): Promise<ActionResult<{ id: string }>> {
  const parsed = createAppointmentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  try {
    const session = await requirePermission("appointments.manage");
    if (isEmpresaUser(session) && session.user.role !== "EMPRESA") {
      // empresa users can request via portal
    }
    if (session.user.role === "VISUALIZADOR") {
      return { success: false, error: "Sem permissão." };
    }

    const d = parsed.data;

    const patient = await prisma.patient.findUnique({
      where: { id: d.patientId },
      select: { companyId: true, fullName: true },
    });
    if (!patient) return { success: false, error: "Colaborador não encontrado." };

    if (isEmpresaUser(session) && patient.companyId !== session.user.companyId) {
      return { success: false, error: "Colaborador não pertence à sua empresa." };
    }

    if (d.referralId) {
      await assertReferralAccess(session, d.referralId);
    }

    if (!options?.forceConflict && (d.professionalId || d.roomName)) {
      const conflict = await checkAppointmentConflict({
        scheduledAt: d.scheduledAt,
        professionalId: d.professionalId,
        roomName: d.roomName,
      });
      if (conflict.success && conflict.hasConflict) {
        return {
          success: false,
          error: "CONFLICT:Já existe um atendimento agendado para este horário. Deseja continuar mesmo assim?",
        };
      }
    }

    const companyId = d.companyId ?? patient.companyId ?? undefined;
    const scheduledAt = new Date(d.scheduledAt);
    const protocol =
      d.protocol ??
      (d.referralId
        ? (
            await prisma.referral.findUnique({
              where: { id: d.referralId },
              select: { protocol: true },
            })
          )?.protocol
        : null);

    const title =
      d.title?.trim() ||
      (protocol ? `Atendimento ${protocol}` : `Atendimento — ${patient.fullName}`);

    const appointment = await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.create({
        data: {
          title,
          protocol: protocol ?? null,
          scheduledAt,
          endAt: d.endAt ? new Date(d.endAt) : null,
          status: "AGENDADO",
          clinicalExamType: d.clinicalExamType ?? undefined,
          type: d.type,
          notes: d.notes?.trim() || null,
          internalNotes: d.internalNotes?.trim() || null,
          attendanceNotes: d.attendanceNotes?.trim() || null,
          patientId: d.patientId,
          companyId,
          referralId: d.referralId || undefined,
          professionalId: d.professionalId || undefined,
          roomName: d.roomName?.trim() || null,
          createdByUserId: session.user.id,
        },
      });

      if (d.examIds?.length) {
        await tx.appointmentExam.createMany({
          data: d.examIds.map((examId) => ({
            appointmentId: apt.id,
            examId,
            status: "PENDENTE",
          })),
        });
      }

      await recordAppointmentHistory(tx, {
        appointmentId: apt.id,
        action: "CREATED",
        toStatus: "AGENDADO",
        notes: d.notes?.trim() || "Agendamento criado",
        performedByUserId: session.user.id,
      });

      if (d.referralId) {
        const referral = await tx.referral.findUnique({
          where: { id: d.referralId },
          select: { status: true },
        });
        if (referral) {
          await tx.referral.update({
            where: { id: d.referralId },
            data: { status: "AGENDADO", scheduledAt },
          });
          await tx.referralStatusHistory.create({
            data: {
              referralId: d.referralId,
              fromStatus: referral.status,
              toStatus: "AGENDADO",
              notes: "Agendamento criado na agenda",
              changedById: session.user.id,
            },
          });

          if (!d.examIds?.length) {
            const referralExams = await tx.referralExam.findMany({
              where: { referralId: d.referralId },
              select: { examId: true },
            });
            if (referralExams.length > 0) {
              await tx.appointmentExam.createMany({
                data: referralExams
                  .filter((re) => re.examId)
                  .map((re) => ({
                    appointmentId: apt.id,
                    examId: re.examId!,
                    status: "PENDENTE" as const,
                  })),
                skipDuplicates: true,
              });
            }
          }
        }
      }

      return apt;
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Appointment",
      entityId: appointment.id,
      details: `Agendamento: ${title}`,
    });

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard");
    if (d.referralId) {
      revalidatePath("/dashboard/encaminhamentos");
    }

    return { success: true, id: appointment.id };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao criar agendamento.") };
  }
}

async function updateAppointmentStatus(
  id: string,
  toStatus: AppointmentStatus,
  action: AppointmentHistoryAction,
  notes?: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("appointments.manage");
    if (session.user.role === "VISUALIZADOR") {
      return { success: false, error: "Sem permissão." };
    }

    const companyFilter = getCompanyFilter(session);
    const appointment = await prisma.appointment.findFirst({
      where: { id, ...companyFilter },
      select: { id: true, status: true, referralId: true, title: true },
    });
    if (!appointment) return { success: false, error: "Agendamento não encontrado." };

    const fromStatus = appointment.status;
    if (fromStatus === toStatus) {
      return { success: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: { status: toStatus },
      });

      await recordAppointmentHistory(tx, {
        appointmentId: id,
        action,
        fromStatus,
        toStatus,
        notes,
        performedByUserId: session.user.id,
      });

      if (appointment.referralId) {
        await syncReferralOnAppointmentChange(
          tx,
          appointment.referralId,
          toStatus,
          session.user.id,
          notes ?? `Agenda: ${fromStatus} → ${toStatus}`
        );
      }
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Appointment",
      entityId: id,
      details: `${appointment.title}: ${fromStatus} → ${toStatus}`,
    });

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard");
    if (appointment.referralId) {
      revalidatePath("/dashboard/encaminhamentos");
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao atualizar agendamento.") };
  }
}

export async function confirmAppointment(id: string, notes?: string) {
  return updateAppointmentStatus(id, "CONFIRMADO", "CONFIRMED", notes ?? "Agendamento confirmado");
}

export async function startAppointmentAttendance(id: string, notes?: string) {
  return updateAppointmentStatus(id, "EM_ATENDIMENTO", "ATTENDANCE_STARTED", notes ?? "Atendimento iniciado");
}

export async function completeAppointment(id: string, notes?: string) {
  return updateAppointmentStatus(id, "CONCLUIDO", "COMPLETED", notes ?? "Atendimento concluído");
}

export async function markAppointmentNoShow(id: string, data: unknown) {
  const parsed = cancelAppointmentSchema.safeParse(
    typeof data === "string" ? { notes: data } : data
  );
  if (!parsed.success || !parsed.data.notes?.trim()) {
    return { success: false, error: "Informe uma observação para registrar a falta." };
  }
  return updateAppointmentStatus(id, "FALTOU", "NO_SHOW", parsed.data.notes.trim());
}

export async function rescheduleAppointment(
  id: string,
  data: unknown,
  options?: { forceConflict?: boolean }
): Promise<ActionResult<{ newId: string }>> {
  const parsed = rescheduleAppointmentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Informe nova data/horário e motivo do reagendamento." };
  }

  try {
    const session = await requirePermission("appointments.manage");
    if (!["ADMIN", "RECEPCAO"].includes(session.user.role)) {
      return { success: false, error: "Sem permissão para reagendar." };
    }

    const companyFilter = getCompanyFilter(session);
    const existing = await prisma.appointment.findFirst({
      where: { id, ...companyFilter },
      include: { exams: true },
    });
    if (!existing) return { success: false, error: "Agendamento não encontrado." };

    const d = parsed.data;
    const newScheduledAt = new Date(d.scheduledAt);

    if (!options?.forceConflict) {
      const conflict = await checkAppointmentConflict({
        scheduledAt: d.scheduledAt,
        professionalId: existing.professionalId,
        roomName: existing.roomName,
        excludeId: id,
      });
      if (conflict.success && conflict.hasConflict) {
        return {
          success: false,
          error: "CONFLICT:Já existe um atendimento agendado para este horário. Deseja continuar mesmo assim?",
        };
      }
    }

    const newId = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: { status: "REAGENDADO" },
      });

      await recordAppointmentHistory(tx, {
        appointmentId: id,
        action: "RESCHEDULED",
        fromStatus: existing.status,
        toStatus: "REAGENDADO",
        notes: d.notes.trim(),
        performedByUserId: session.user.id,
      });

      const newApt = await tx.appointment.create({
        data: {
          title: existing.title,
          protocol: existing.protocol,
          scheduledAt: newScheduledAt,
          endAt: existing.endAt,
          status: "AGENDADO",
          clinicalExamType: existing.clinicalExamType,
          type: existing.type,
          notes: existing.notes,
          internalNotes: existing.internalNotes,
          attendanceNotes: existing.attendanceNotes,
          patientId: existing.patientId,
          companyId: existing.companyId,
          referralId: existing.referralId,
          professionalId: existing.professionalId,
          roomName: existing.roomName,
          createdByUserId: session.user.id,
        },
      });

      if (existing.exams.length > 0) {
        await tx.appointmentExam.createMany({
          data: existing.exams.map((e) => ({
            appointmentId: newApt.id,
            examId: e.examId,
            status: e.status,
            notes: e.notes,
          })),
        });
      }

      await recordAppointmentHistory(tx, {
        appointmentId: newApt.id,
        action: "CREATED",
        toStatus: "AGENDADO",
        notes: `Reagendado de ${existing.id}: ${d.notes.trim()}`,
        performedByUserId: session.user.id,
      });

      if (existing.referralId) {
        await tx.referral.update({
          where: { id: existing.referralId },
          data: { scheduledAt: newScheduledAt, status: "AGENDADO" },
        });
        await tx.referralStatusHistory.create({
          data: {
            referralId: existing.referralId,
            fromStatus: "AGENDADO",
            toStatus: "AGENDADO",
            notes: `Reagendado: ${d.notes.trim()}`,
            changedById: session.user.id,
          },
        });
      }

      return newApt.id;
    });

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard");
    return { success: true, newId };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao reagendar.") };
  }
}

export async function cancelAppointment(id: string, data: unknown): Promise<ActionResult> {
  const parsed = cancelAppointmentSchema.safeParse(data);
  if (!parsed.success || !parsed.data.notes?.trim()) {
    return { success: false, error: "Informe o motivo do cancelamento." };
  }
  return updateAppointmentStatus(id, "CANCELADO", "CANCELLED", parsed.data.notes.trim());
}

export async function addAppointmentNote(id: string, data: unknown): Promise<ActionResult> {
  const parsed = addAppointmentNoteSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Observação inválida." };
  }

  try {
    const session = await requirePermission("appointments.manage");
    const companyFilter = getCompanyFilter(session);
    const appointment = await prisma.appointment.findFirst({
      where: { id, ...companyFilter },
      select: { id: true },
    });
    if (!appointment) return { success: false, error: "Agendamento não encontrado." };

    const field = parsed.data.type === "internal" ? "internalNotes" : "attendanceNotes";
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { internalNotes: true, attendanceNotes: true },
    });

    const current = existing?.[field] ?? "";
    const updated = current
      ? `${current}\n\n[${new Date().toLocaleString("pt-BR")}] ${parsed.data.note.trim()}`
      : parsed.data.note.trim();

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: { [field]: updated },
      });
      await recordAppointmentHistory(tx, {
        appointmentId: id,
        action: "NOTE_ADDED",
        notes: parsed.data.note.trim(),
        performedByUserId: session.user.id,
      });
    });

    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao adicionar observação.") };
  }
}

export async function getAppointmentFormOptions() {
  try {
    const session = await requirePermission("appointments.manage");
    const companyFilter = getCompanyFilter(session);

    const [patients, companies, referrals, exams, professionals] = await Promise.all([
      prisma.patient.findMany({
        where: { ...companyFilter, status: "ACTIVE" },
        select: { id: true, fullName: true, companyId: true },
        orderBy: { fullName: "asc" },
        take: 500,
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
          status: { in: ["NOVO", "EM_ANALISE", "AGUARDANDO_AGENDAMENTO", "AGENDADO"] },
        },
        select: {
          id: true,
          protocol: true,
          patientId: true,
          companyId: true,
          clinicalExamType: true,
          internalNotes: true,
          exams: { include: { exam: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.exam.findMany({
        where: { active: true },
        select: { id: true, name: true, category: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { status: "ACTIVE", role: { in: ["MEDICO", "TECNICO", "ADMIN"] } },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      success: true as const,
      patients,
      companies,
      referrals,
      exams,
      professionals,
      rooms: ["Sala 1", "Sala 2", "Sala 3", "Unidade Centro", "Unidade Norte"],
    };
  } catch {
    return { success: false as const, error: "Erro ao carregar opções." };
  }
}

export async function createAppointmentFromReferral(
  referralId: string,
  data: { scheduledAt: string; notes?: string; professionalId?: string; roomName?: string },
  options?: { forceConflict?: boolean }
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("referrals.manage");
    if (session.user.role === "EMPRESA") throw new Error("FORBIDDEN");
    await assertReferralAccess(session, referralId);

    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: { exams: true },
    });
    if (!referral) return { success: false, error: "Encaminhamento não encontrado." };

    return createAppointmentFull(
      {
        patientId: referral.patientId,
        companyId: referral.companyId,
        referralId: referral.id,
        protocol: referral.protocol,
        clinicalExamType: referral.clinicalExamType,
        scheduledAt: data.scheduledAt,
        notes: data.notes,
        professionalId: data.professionalId,
        roomName: data.roomName,
        examIds: referral.exams.map((e) => e.examId).filter((id): id is string => !!id),
        internalNotes: referral.internalNotes ?? undefined,
      },
      options
    );
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao agendar.") };
  }
}
