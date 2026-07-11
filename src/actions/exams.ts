"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ExamHistoryAction, ExamStatus } from "@prisma/client";
import { requirePermission } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import {
  buildExamListWhere,
  buildExamOrderBy,
  getExamPageSize,
  resolveExamPageSize,
  serializeExamDetail,
  serializeExamListItem,
  slugifyExamName,
  inferDeadlineType,
  type ExamDetailSerialized,
  type ExamListFilters,
  type ExamListItem,
  PUBLIC_WEBSITE_EXAM_WHERE,
  PUBLIC_FORM_EXAM_WHERE,
  REFERRAL_SELECT_EXAM_WHERE,
  examToGuide,
} from "@/lib/exams";
import type { ExamGuide } from "@/data/exams";
import { examFormSchema, examStatusToggleSchema } from "@/schemas";
import type { ExamCategory } from "@prisma/client";

type ActionResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

async function recordExamHistory(
  examId: string,
  action: ExamHistoryAction,
  userId: string,
  notes?: string
) {
  await prisma.examHistory.create({
    data: {
      examId,
      action,
      notes: notes?.trim() || null,
      performedByUserId: userId,
    },
  });
}

export async function listExamsForDashboard(filters: ExamListFilters = {}): Promise<{
  items: ExamListItem[];
  total: number;
  page: number;
  pageSize: number;
  statCounts: Record<string, number>;
}> {
  const pageSize =
    filters.pageSize != null ? resolveExamPageSize(filters.pageSize) : getExamPageSize();
  const page = Math.max(1, filters.page ?? 1);
  const where = buildExamListWhere(filters);
  const orderBy = buildExamOrderBy(filters.sort);

  const [
    items,
    total,
    ativos,
    inativos,
    semPreparo,
    preparoObrigatorio,
    laboratoriais,
    noSite,
  ] = await Promise.all([
    prisma.exam.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.exam.count({ where }),
    prisma.exam.count({ where: { status: "ATIVO" } }),
    prisma.exam.count({ where: { status: "INATIVO" } }),
    prisma.exam.count({ where: { preparationType: "SEM_PREPARO" } }),
    prisma.exam.count({
      where: {
        preparationType: {
          in: [
            "PREPARO_NECESSARIO",
            "JEJUM_NECESSARIO",
            "ATENCAO_ESPECIAL",
            "VERIFICAR_EXAME",
            "ORIENTACAO_ESPECIFICA",
          ],
        },
      },
    }),
    prisma.exam.count({ where: { category: "LABORATORIAL" } }),
    prisma.exam.count({ where: { showOnWebsite: true, status: "ATIVO" } }),
  ]);

  return {
    items: items.map(serializeExamListItem),
    total,
    page,
    pageSize,
    statCounts: {
      ativos,
      inativos,
      sem_preparo: semPreparo,
      preparo_obrigatorio: preparoObrigatorio,
      laboratoriais,
      no_site: noSite,
    },
  };
}

/** Contagens por categoria para a navegação do catálogo clínico (respeita filtro de status). */
export async function getExamCategoryNavCounts(status?: string): Promise<{
  total: number;
  byCategory: Partial<Record<ExamCategory, number>>;
}> {
  const statusWhere =
    status === "ATIVO" || status === "INATIVO" ? { status: status as ExamStatus } : {};

  const [total, grouped] = await Promise.all([
    prisma.exam.count({ where: statusWhere }),
    prisma.exam.groupBy({
      by: ["category"],
      where: statusWhere,
      _count: { _all: true },
    }),
  ]);

  const byCategory: Partial<Record<ExamCategory, number>> = {};
  for (const row of grouped) {
    byCategory[row.category] = row._count._all;
  }

  return { total, byCategory };
}

export async function getExamDetail(
  id: string
): Promise<ActionResult<{ exam: ExamDetailSerialized }>> {
  try {
    await requirePermission("exams.view");

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { performedBy: { select: { name: true } } },
        },
      },
    });

    if (!exam) return { success: false, error: "Exame não encontrado." };
    return { success: true, exam: serializeExamDetail(exam) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao carregar exame." };
  }
}

export async function createExam(
  raw: unknown
): Promise<ActionResult<{ examId: string }>> {
  try {
    const session = await requirePermission("exams.manage");
    const d = examFormSchema.parse(raw);

    let slug = slugifyExamName(d.name);
    const existing = await prisma.exam.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const showOnWebsite = d.publishOnSave ? true : d.showOnWebsite;

    const exam = await prisma.$transaction(async (tx) => {
      const created = await tx.exam.create({
        data: {
          name: d.name.trim(),
          slug,
          category: d.category,
          shortDescription: d.shortDescription?.trim() || null,
          status: d.status,
          showOnWebsite,
          availableOnPublicForm: d.availableOnPublicForm,
          availableOnCompanyPortal: d.availableOnCompanyPortal,
          preparationType: d.preparationType,
          preparationBefore: d.preparationBefore?.trim() || null,
          instructionsOnDay: d.instructionsOnDay?.trim() || null,
          averageDeadline: d.averageDeadline?.trim() || null,
          deadlineType: d.deadlineType ?? inferDeadlineType(d.averageDeadline),
          observations: d.observations?.trim() || null,
          whenToNotifyClinic: d.whenToNotifyClinic?.trim() || null,
          requiresAppointment: d.requiresAppointment,
          requiresProfessional: d.requiresProfessional,
          requiresAttachment: d.requiresAttachment,
          displayOrder: d.displayOrder ?? null,
          internalTags: d.internalTags?.trim() || null,
        },
      });

      await tx.examHistory.create({
        data: {
          examId: created.id,
          action: "CREATED",
          performedByUserId: session.user.id,
        },
      });

      if (showOnWebsite) {
        await tx.examHistory.create({
          data: {
            examId: created.id,
            action: "PUBLISHED",
            performedByUserId: session.user.id,
          },
        });
      }

      return created;
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Exam",
      entityId: exam.id,
      details: exam.name,
    });

    revalidatePath("/dashboard/exames");
    revalidatePath("/exames");
    return { success: true, examId: exam.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao criar exame." };
  }
}

export async function updateExam(
  examId: string,
  raw: unknown
): Promise<ActionResult> {
  try {
    const session = await requirePermission("exams.manage");
    const d = examFormSchema.parse(raw);

    const existing = await prisma.exam.findUnique({ where: { id: examId } });
    if (!existing) return { success: false, error: "Exame não encontrado." };

    const showOnWebsite = d.publishOnSave ? true : d.showOnWebsite;

    await prisma.$transaction(async (tx) => {
      await tx.exam.update({
        where: { id: examId },
        data: {
          name: d.name.trim(),
          category: d.category,
          shortDescription: d.shortDescription?.trim() || null,
          status: d.status,
          showOnWebsite,
          availableOnPublicForm: d.availableOnPublicForm,
          availableOnCompanyPortal: d.availableOnCompanyPortal,
          preparationType: d.preparationType,
          preparationBefore: d.preparationBefore?.trim() || null,
          instructionsOnDay: d.instructionsOnDay?.trim() || null,
          averageDeadline: d.averageDeadline?.trim() || null,
          deadlineType: d.deadlineType ?? inferDeadlineType(d.averageDeadline),
          observations: d.observations?.trim() || null,
          whenToNotifyClinic: d.whenToNotifyClinic?.trim() || null,
          requiresAppointment: d.requiresAppointment,
          requiresProfessional: d.requiresProfessional,
          requiresAttachment: d.requiresAttachment,
          displayOrder: d.displayOrder ?? null,
          internalTags: d.internalTags?.trim() || null,
        },
      });

      const historyNotes: { action: ExamHistoryAction; notes?: string }[] = [
        { action: "UPDATED" },
      ];

      if (
        existing.preparationType !== d.preparationType ||
        existing.preparationBefore !== (d.preparationBefore?.trim() || null) ||
        existing.instructionsOnDay !== (d.instructionsOnDay?.trim() || null)
      ) {
        historyNotes.push({ action: "PREPARATION_CHANGED" });
      }

      if (
        existing.averageDeadline !== (d.averageDeadline?.trim() || null) ||
        existing.deadlineType !== (d.deadlineType ?? inferDeadlineType(d.averageDeadline))
      ) {
        historyNotes.push({ action: "DEADLINE_CHANGED" });
      }

      if (existing.status !== d.status) {
        historyNotes.push({
          action: "STATUS_CHANGED",
          notes: `${existing.status} → ${d.status}`,
        });
      }

      if (existing.showOnWebsite !== showOnWebsite) {
        historyNotes.push({
          action: showOnWebsite ? "PUBLISHED" : "UNPUBLISHED",
        });
      }

      for (const entry of historyNotes) {
        await tx.examHistory.create({
          data: {
            examId,
            action: entry.action,
            notes: entry.notes ?? null,
            performedByUserId: session.user.id,
          },
        });
      }
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Exam",
      entityId: examId,
      details: d.name,
    });

    revalidatePath("/dashboard/exames");
    revalidatePath("/exames");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao atualizar exame." };
  }
}

export async function toggleExamStatus(
  raw: unknown
): Promise<ActionResult> {
  try {
    const session = await requirePermission("exams.manage");
    const { examId, status } = examStatusToggleSchema.parse(raw);

    const existing = await prisma.exam.findUnique({ where: { id: examId } });
    if (!existing) return { success: false, error: "Exame não encontrado." };

    const newStatus: ExamStatus = existing.status === "ATIVO" ? "INATIVO" : "ATIVO";
    const targetStatus = status ?? newStatus;

    await prisma.exam.update({
      where: { id: examId },
      data: { status: targetStatus },
    });

    await recordExamHistory(
      examId,
      "STATUS_CHANGED",
      session.user.id,
      `${existing.status} → ${targetStatus}`
    );

    revalidatePath("/dashboard/exames");
    revalidatePath("/exames");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao alterar status." };
  }
}

export async function duplicateExam(examId: string): Promise<ActionResult<{ examId: string }>> {
  try {
    const session = await requirePermission("exams.manage");
    const existing = await prisma.exam.findUnique({ where: { id: examId } });
    if (!existing) return { success: false, error: "Exame não encontrado." };

    const baseSlug = `${existing.slug}-copia`;
    let slug = baseSlug;
    let i = 1;
    while (await prisma.exam.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const copy = await prisma.$transaction(async (tx) => {
      const created = await tx.exam.create({
        data: {
          name: `${existing.name} (cópia)`,
          slug,
          category: existing.category,
          shortDescription: existing.shortDescription,
          preparationType: existing.preparationType,
          preparationBefore: existing.preparationBefore,
          instructionsOnDay: existing.instructionsOnDay,
          averageDeadline: existing.averageDeadline,
          deadlineType: existing.deadlineType,
          observations: existing.observations,
          whenToNotifyClinic: existing.whenToNotifyClinic,
          requiresAppointment: existing.requiresAppointment,
          requiresProfessional: existing.requiresProfessional,
          requiresAttachment: existing.requiresAttachment,
          showOnWebsite: false,
          availableOnPublicForm: existing.availableOnPublicForm,
          availableOnCompanyPortal: existing.availableOnCompanyPortal,
          displayOrder: existing.displayOrder,
          internalTags: existing.internalTags,
          status: "INATIVO",
        },
      });

      await tx.examHistory.create({
        data: {
          examId: created.id,
          action: "DUPLICATED",
          notes: `Cópia de ${existing.name}`,
          performedByUserId: session.user.id,
        },
      });

      await tx.examHistory.create({
        data: {
          examId: created.id,
          action: "CREATED",
          performedByUserId: session.user.id,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/exames");
    return { success: true, examId: copy.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao duplicar exame." };
  }
}

export async function getPublicWebsiteExams(): Promise<ExamGuide[]> {
  const exams = await prisma.exam.findMany({
    where: PUBLIC_WEBSITE_EXAM_WHERE,
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  return exams.map(examToGuide);
}

export async function getPublicFormExamOptions(): Promise<string[]> {
  const exams = await prisma.exam.findMany({
    where: PUBLIC_FORM_EXAM_WHERE,
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: { name: true },
  });
  return exams.map((e) => e.name);
}

export async function getReferralCatalogExams() {
  const exams = await prisma.exam.findMany({
    where: REFERRAL_SELECT_EXAM_WHERE,
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      preparationType: true,
      preparationBefore: true,
      instructionsOnDay: true,
      averageDeadline: true,
    },
  });
  return exams;
}
