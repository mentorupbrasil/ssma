"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { SstDocKind, SstDocStage } from "@prisma/client";
import { requirePermission, actionError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, scopedWhere, withClinicId } from "@/lib/scoped-db";
import { createNotification } from "@/lib/notifications";
import {
  buildAssistedSstText,
  buildSstChecklist,
  defaultSstTitle,
  emptyContentForKind,
  getSstModel,
  isTechnicalSstKind,
  listTabStages,
  mapSstKindToDocumentType,
  parseSstJson,
  type CompanySstContext,
  type SstContentMap,
} from "@/lib/sst-assistant";

type Result = { success: true; id: string } | { success: false; error: string };

const PAGE_SIZE = 25;
const SST_DOC_TYPES = [
  "PGR",
  "PCMSO",
  "LTCAT",
  "LAUDO_INSALUBRIDADE",
  "LAUDO_PERICULOSIDADE",
  "PPP",
  "DOCUMENTO_ADMINISTRATIVO",
  "OUTRO",
  "LAUDO",
] as const;

function revalidateSst() {
  revalidatePath("/dashboard/assistente-sst");
  revalidatePath("/dashboard/documentos");
  revalidatePath("/dashboard/tarefas");
}

export async function listSstDraftsDashboard(filters: {
  tab?: string;
  q?: string;
  companyId?: string;
  page?: number;
}) {
  const session = await requirePermission("sst_assistant.manage");
  const scope = scopedWhere(session, {});
  const page = Math.max(1, filters.page ?? 1);
  const stages = listTabStages(filters.tab ?? "elaboracao");

  const where = {
    ...scope,
    ...(stages ? { stage: { in: stages } } : { stage: { not: "ARQUIVADO" as const } }),
    ...(filters.companyId ? { companyId: filters.companyId } : {}),
    ...(filters.q?.trim()
      ? {
          OR: [
            { title: { contains: filters.q.trim(), mode: "insensitive" as const } },
            { company: { legalName: { contains: filters.q.trim(), mode: "insensitive" as const } } },
            { company: { tradeName: { contains: filters.q.trim(), mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.sstDraft.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        company: { select: { tradeName: true, legalName: true } },
        technicalResponsible: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.sstDraft.count({ where }),
  ]);

  return {
    items: items.map((d) => ({
      id: d.id,
      title: d.title,
      kind: d.kind,
      stage: d.stage,
      complexity: d.complexity,
      version: d.version,
      companyId: d.companyId,
      companyName: d.company.tradeName ?? d.company.legalName,
      responsibleName: d.technicalResponsible?.name ?? null,
      responsibleId: d.technicalResponsible?.id ?? null,
      createdByName: d.createdBy.name,
      updatedAt: d.updatedAt.toISOString(),
      approvedAt: d.approvedAt?.toISOString() ?? null,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getCompanySstContext(companyId: string): Promise<CompanySstContext | null> {
  const session = await requirePermission("sst_assistant.manage");
  const company = await prisma.company.findFirst({
    where: scopedWhere(session, { id: companyId }),
    include: {
      patients: {
        where: { status: { in: ["ATIVO", "PENDENTE", "AFASTADO"] } },
        select: { department: true, jobTitle: true },
        take: 2000,
      },
      documents: {
        where: { type: { in: [...SST_DOC_TYPES] } },
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: { id: true, title: true, type: true, status: true, updatedAt: true },
      },
      priceListItems: {
        where: { status: "ATIVA" },
        take: 40,
        select: {
          name: true,
          exam: { select: { name: true } },
        },
      },
    },
  });
  if (!company) return null;

  const departments = [
    ...new Set(company.patients.map((p) => p.department?.trim()).filter(Boolean) as string[]),
  ].sort();
  const jobTitles = [
    ...new Set(company.patients.map((p) => p.jobTitle?.trim()).filter(Boolean) as string[]),
  ].sort();

  return {
    companyId: company.id,
    companyName: company.tradeName ?? company.legalName,
    cnpj: company.cnpj,
    segment: company.segment,
    address: company.address,
    city: company.city,
    state: company.state,
    responsibleName: company.responsibleName,
    employeeCount: company.patients.length,
    departments,
    jobTitles,
    employeesWithoutDept: company.patients.filter((p) => !p.department?.trim()).length,
    employeesWithoutJob: company.patients.filter((p) => !p.jobTitle?.trim()).length,
    priorDocuments: company.documents.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      status: d.status,
      updatedAt: d.updatedAt.toISOString(),
    })),
    linkedExamTitles: [
      ...new Set(
        company.priceListItems
          .map((i) => i.exam?.name ?? i.name)
          .filter(Boolean)
      ),
    ],
  };
}

export async function getSstDraftDetail(id: string) {
  const session = await requirePermission("sst_assistant.manage");
  const draft = await prisma.sstDraft.findFirst({
    where: scopedWhere(session, { id }),
    include: {
      company: {
        select: {
          id: true,
          legalName: true,
          tradeName: true,
          cnpj: true,
          segment: true,
        },
      },
      technicalResponsible: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { createdBy: { select: { name: true } } },
      },
      versions: {
        orderBy: { version: "desc" },
        take: 20,
        include: { createdBy: { select: { name: true } } },
      },
      publishedDocument: { select: { id: true, title: true, status: true } },
    },
  });
  if (!draft) return null;

  const ctx = await getCompanySstContext(draft.companyId);
  const content = parseSstJson<SstContentMap>(draft.contentJson, emptyContentForKind(draft.kind));
  const checklist =
    parseSstJson(draft.checklistJson, null) ??
    (ctx
      ? buildSstChecklist(ctx, draft.kind, Boolean(draft.technicalResponsibleUserId))
      : []);

  return {
    id: draft.id,
    title: draft.title,
    kind: draft.kind,
    stage: draft.stage,
    complexity: draft.complexity,
    version: draft.version,
    content,
    checklist,
    attachments: parseSstJson<{ name: string; url: string; notes?: string }[]>(draft.attachmentsJson, []),
    company: {
      id: draft.company.id,
      name: draft.company.tradeName ?? draft.company.legalName,
      cnpj: draft.company.cnpj,
      segment: draft.company.segment,
    },
    technicalResponsible: draft.technicalResponsible,
    createdBy: draft.createdBy,
    reviewedBy: draft.reviewedBy,
    approvedBy: draft.approvedBy,
    approvedAt: draft.approvedAt?.toISOString() ?? null,
    publishedDocument: draft.publishedDocument,
    validUntil: draft.validUntil?.toISOString() ?? null,
    notes: draft.notes,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
    comments: draft.comments.map((c) => ({
      id: c.id,
      sectionKey: c.sectionKey,
      content: c.content,
      createdByName: c.createdBy.name,
      createdAt: c.createdAt.toISOString(),
    })),
    versions: draft.versions.map((v) => ({
      id: v.id,
      version: v.version,
      stage: v.stage,
      notes: v.notes,
      createdByName: v.createdBy.name,
      createdAt: v.createdAt.toISOString(),
    })),
    preview: buildAssistedSstText({
      kind: draft.kind,
      companyName: draft.company.tradeName ?? draft.company.legalName,
      cnpj: draft.company.cnpj,
      segment: draft.company.segment,
      responsibleName: draft.technicalResponsible?.name,
      content,
      checklist: Array.isArray(checklist) ? checklist : [],
      version: draft.version,
    }),
    companyContext: ctx,
  };
}

export async function createSstDraft(input: {
  companyId: string;
  kind: SstDocKind;
  technicalResponsibleUserId?: string;
  importDocumentId?: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("sst_assistant.manage");
    const clinicId = await resolveClinicId(session);
    const company = await prisma.company.findFirst({
      where: scopedWhere(session, { id: input.companyId }),
      select: { id: true, legalName: true, tradeName: true },
    });
    if (!company) return { success: false, error: "Empresa não encontrada." };

    const model = getSstModel(input.kind);
    const ctx = await getCompanySstContext(input.companyId);
    if (!ctx) return { success: false, error: "Não foi possível carregar dados da empresa." };

    const content = emptyContentForKind(input.kind);
    if (input.importDocumentId) {
      const prior = await prisma.document.findFirst({
        where: scopedWhere(session, { id: input.importDocumentId, companyId: input.companyId }),
        select: { title: true, notes: true, type: true },
      });
      if (prior) {
        content.importacao = `Importado de: ${prior.title} (${prior.type})${
          prior.notes ? `\n\n${prior.notes}` : ""
        }\n\nComplemente as seções específicas. Não copie conclusões sem validação técnica.`;
        if (content.objetivo !== undefined && !content.objetivo) {
          content.objetivo = `Documento baseado em versão anterior: ${prior.title}`;
        }
        if (content.conteudo !== undefined && !content.conteudo) {
          content.conteudo = prior.notes ?? "";
        }
      }
    }

    const checklist = buildSstChecklist(
      ctx,
      input.kind,
      Boolean(input.technicalResponsibleUserId)
    );

    const draft = await prisma.sstDraft.create({
      data: withClinicId(
        {
          companyId: company.id,
          kind: input.kind,
          title: defaultSstTitle(input.kind, company.tradeName ?? company.legalName),
          stage: "RASCUNHO",
          complexity: model.complexity,
          contentJson: JSON.stringify(content),
          checklistJson: JSON.stringify(checklist),
          technicalResponsibleUserId: input.technicalResponsibleUserId || null,
          createdByUserId: session.user.id,
        },
        clinicId
      ),
    });

    await prisma.sstDraftVersion.create({
      data: {
        draftId: draft.id,
        version: 1,
        contentJson: draft.contentJson,
        stage: draft.stage,
        notes: "Criação do rascunho",
        createdByUserId: session.user.id,
      },
    });

    await createAuditLog({ action: "CREATE", entity: "SstDraft", entityId: draft.id });
    revalidateSst();
    return { success: true, id: draft.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao criar documento SST.") };
  }
}

export async function updateSstDraftContent(input: {
  id: string;
  content?: SstContentMap;
  attachments?: { name: string; url: string; notes?: string }[];
  technicalResponsibleUserId?: string | null;
  notes?: string;
  validUntil?: string | null;
  bumpVersion?: boolean;
}): Promise<Result> {
  try {
    const session = await requirePermission("sst_assistant.manage");
    const draft = await prisma.sstDraft.findFirst({
      where: scopedWhere(session, { id: input.id }),
    });
    if (!draft) return { success: false, error: "Documento não encontrado." };
    if (draft.stage === "ARQUIVADO") return { success: false, error: "Documento arquivado." };
    if (draft.stage === "APROVADO") {
      return { success: false, error: "Documento aprovado. Duplique para nova versão." };
    }

    const nextVersion = input.bumpVersion ? draft.version + 1 : draft.version;
    const contentJson = input.content ? JSON.stringify(input.content) : draft.contentJson;
    const attachmentsJson = input.attachments
      ? JSON.stringify(input.attachments)
      : draft.attachmentsJson;

    const responsibleId =
      input.technicalResponsibleUserId !== undefined
        ? input.technicalResponsibleUserId
        : draft.technicalResponsibleUserId;

    const ctx = await getCompanySstContext(draft.companyId);
    const checklist = ctx
      ? buildSstChecklist(ctx, draft.kind, Boolean(responsibleId))
      : parseSstJson(draft.checklistJson, []);

    await prisma.sstDraft.update({
      where: { id: draft.id },
      data: {
        contentJson,
        attachmentsJson,
        checklistJson: JSON.stringify(checklist),
        technicalResponsibleUserId: responsibleId,
        notes: input.notes !== undefined ? input.notes : draft.notes,
        validUntil:
          input.validUntil !== undefined
            ? input.validUntil
              ? new Date(input.validUntil)
              : null
            : draft.validUntil,
        version: nextVersion,
        stage: draft.stage === "RASCUNHO" ? "EM_ELABORACAO" : draft.stage,
      },
    });

    if (input.bumpVersion) {
      await prisma.sstDraftVersion.create({
        data: {
          draftId: draft.id,
          version: nextVersion,
          contentJson,
          stage: draft.stage === "RASCUNHO" ? "EM_ELABORACAO" : draft.stage,
          notes: "Nova versão do conteúdo",
          createdByUserId: session.user.id,
        },
      });
    }

    revalidateSst();
    return { success: true, id: draft.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao salvar rascunho.") };
  }
}

async function transitionStage(
  id: string,
  to: SstDocStage,
  opts?: { reviewComment?: string }
): Promise<Result> {
  try {
    const session = await requirePermission("sst_assistant.manage");
    const draft = await prisma.sstDraft.findFirst({
      where: scopedWhere(session, { id }),
      include: { technicalResponsible: { select: { id: true, name: true } } },
    });
    if (!draft) return { success: false, error: "Documento não encontrado." };

    if (to === "AGUARDANDO_REVISAO") {
      if (!["RASCUNHO", "EM_ELABORACAO"].includes(draft.stage)) {
        return { success: false, error: "Só é possível enviar rascunhos em elaboração." };
      }
      if (isTechnicalSstKind(draft.kind) && !draft.technicalResponsibleUserId) {
        return { success: false, error: "Defina o responsável técnico antes de enviar para revisão." };
      }
    }

    if (to === "APROVADO") {
      if (draft.stage !== "AGUARDANDO_REVISAO") {
        return { success: false, error: "Aprove apenas documentos em revisão." };
      }
      if (!draft.technicalResponsibleUserId) {
        return { success: false, error: "Não é permitido aprovar sem responsável técnico definido." };
      }
    }

    if (to === "EM_ELABORACAO" && draft.stage !== "AGUARDANDO_REVISAO") {
      return { success: false, error: "Só é possível devolver documentos em revisão." };
    }

    const data: Record<string, unknown> = { stage: to };
    if (to === "AGUARDANDO_REVISAO") {
      data.reviewedByUserId = null;
    }
    if (to === "APROVADO") {
      data.approvedByUserId = session.user.id;
      data.approvedAt = new Date();
      data.reviewedByUserId = session.user.id;
    }
    if (to === "EM_ELABORACAO") {
      data.reviewedByUserId = session.user.id;
    }

    await prisma.sstDraft.update({ where: { id: draft.id }, data });
    await prisma.sstDraftVersion.create({
      data: {
        draftId: draft.id,
        version: draft.version,
        contentJson: draft.contentJson,
        stage: to,
        notes:
          to === "EM_ELABORACAO"
            ? opts?.reviewComment || "Devolvido para correção"
            : to === "AGUARDANDO_REVISAO"
              ? "Enviado para revisão"
              : to === "APROVADO"
                ? "Aprovado pelo responsável"
                : `Etapa: ${to}`,
        createdByUserId: session.user.id,
      },
    });

    if (opts?.reviewComment && to === "EM_ELABORACAO") {
      await prisma.sstDraftComment.create({
        data: {
          draftId: draft.id,
          content: opts.reviewComment,
          createdByUserId: session.user.id,
        },
      });
    }

    if (to === "AGUARDANDO_REVISAO" && draft.technicalResponsibleUserId) {
      await createNotification({
        userId: draft.technicalResponsibleUserId,
        title: "Documento SST aguardando revisão",
        message: draft.title,
        link: `/dashboard/assistente-sst?id=${draft.id}&tab=revisao`,
        sendEmail: true,
      });
    }

    revalidateSst();
    return { success: true, id: draft.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar etapa.") };
  }
}

export async function sendSstDraftForReview(id: string): Promise<Result> {
  return transitionStage(id, "AGUARDANDO_REVISAO");
}

export async function returnSstDraftForCorrection(
  id: string,
  comment: string
): Promise<Result> {
  if (!comment.trim()) return { success: false, error: "Informe o motivo da devolução." };
  return transitionStage(id, "EM_ELABORACAO", { reviewComment: comment.trim() });
}

export async function approveSstDraft(id: string): Promise<Result> {
  return transitionStage(id, "APROVADO");
}

export async function archiveSstDraft(id: string): Promise<Result> {
  try {
    const session = await requirePermission("sst_assistant.manage");
    const draft = await prisma.sstDraft.findFirst({
      where: scopedWhere(session, { id }),
    });
    if (!draft) return { success: false, error: "Documento não encontrado." };
    await prisma.sstDraft.update({
      where: { id },
      data: { stage: "ARQUIVADO" },
    });
    revalidateSst();
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao arquivar.") };
  }
}

export async function duplicateSstDraft(id: string): Promise<Result> {
  try {
    const session = await requirePermission("sst_assistant.manage");
    const clinicId = await resolveClinicId(session);
    const draft = await prisma.sstDraft.findFirst({
      where: scopedWhere(session, { id }),
    });
    if (!draft) return { success: false, error: "Documento não encontrado." };

    const copy = await prisma.sstDraft.create({
      data: withClinicId(
        {
          companyId: draft.companyId,
          kind: draft.kind,
          title: `${draft.title} (cópia)`,
          stage: "RASCUNHO",
          complexity: draft.complexity,
          version: 1,
          contentJson: draft.contentJson,
          checklistJson: draft.checklistJson,
          attachmentsJson: draft.attachmentsJson,
          technicalResponsibleUserId: draft.technicalResponsibleUserId,
          createdByUserId: session.user.id,
          notes: draft.notes,
        },
        clinicId
      ),
    });

    await prisma.sstDraftVersion.create({
      data: {
        draftId: copy.id,
        version: 1,
        contentJson: copy.contentJson,
        stage: "RASCUNHO",
        notes: `Duplicado de ${draft.id}`,
        createdByUserId: session.user.id,
      },
    });

    revalidateSst();
    return { success: true, id: copy.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao duplicar.") };
  }
}

export async function addSstDraftComment(input: {
  id: string;
  content: string;
  sectionKey?: string;
}): Promise<Result> {
  try {
    const session = await requirePermission("sst_assistant.manage");
    if (!input.content.trim()) return { success: false, error: "Comentário vazio." };
    const draft = await prisma.sstDraft.findFirst({
      where: scopedWhere(session, { id: input.id }),
    });
    if (!draft) return { success: false, error: "Documento não encontrado." };

    await prisma.sstDraftComment.create({
      data: {
        draftId: draft.id,
        content: input.content.trim(),
        sectionKey: input.sectionKey || null,
        createdByUserId: session.user.id,
      },
    });
    revalidateSst();
    return { success: true, id: draft.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao comentar.") };
  }
}

export async function finalizeSstDraft(input: {
  id: string;
  validUntil?: string | null;
}): Promise<Result> {
  try {
    const session = await requirePermission("sst_assistant.manage");
    const draft = await prisma.sstDraft.findFirst({
      where: scopedWhere(session, { id: input.id }),
      include: {
        company: { select: { legalName: true, tradeName: true, cnpj: true, segment: true } },
        technicalResponsible: { select: { id: true, name: true } },
      },
    });
    if (!draft) return { success: false, error: "Documento não encontrado." };
    if (draft.stage !== "APROVADO") {
      return { success: false, error: "Finalize somente após aprovação." };
    }
    if (!draft.technicalResponsibleUserId || !draft.technicalResponsible) {
      return { success: false, error: "Responsável técnico obrigatório para finalizar." };
    }
    if (draft.publishedDocumentId) {
      return { success: true, id: draft.publishedDocumentId };
    }

    const content = parseSstJson<SstContentMap>(draft.contentJson, {});
    const body = buildAssistedSstText({
      kind: draft.kind,
      companyName: draft.company.tradeName ?? draft.company.legalName,
      cnpj: draft.company.cnpj,
      segment: draft.company.segment,
      responsibleName: draft.technicalResponsible.name,
      content,
      version: draft.version,
    });

    const validUntil = input.validUntil
      ? new Date(input.validUntil)
      : draft.validUntil;

    const doc = await prisma.document.create({
      data: {
        title: draft.title,
        type: mapSstKindToDocumentType(draft.kind),
        status: "DISPONIVEL",
        companyId: draft.companyId,
        issuedAt: draft.approvedAt ?? new Date(),
        validUntil,
        notes: [
          body,
          "",
          `Responsável técnico: ${draft.technicalResponsible.name}`,
          `Aprovado em: ${(draft.approvedAt ?? new Date()).toISOString()}`,
          `Versão SST: ${draft.version}`,
        ].join("\n"),
        asoProfessionalName: draft.technicalResponsible.name,
        uploadedByUserId: session.user.id,
      },
    });

    await prisma.documentHistory.create({
      data: {
        documentId: doc.id,
        action: "CREATED",
        notes: `Publicado a partir do Assistente SST (${draft.id})`,
        performedByUserId: session.user.id,
      },
    });

    await prisma.sstDraft.update({
      where: { id: draft.id },
      data: {
        publishedDocumentId: doc.id,
        validUntil: validUntil ?? draft.validUntil,
      },
    });

    if (validUntil) {
      const sourceKey = `sst-review:${draft.id}`;
      const existing = await prisma.task.findFirst({
        where: { sourceKey, status: { in: ["PENDENTE", "EM_ANDAMENTO"] } },
      });
      if (!existing) {
        const clinicId = await resolveClinicId(session);
        await prisma.task.create({
          data: withClinicId(
            {
              title: `Revisar ${draft.title}`,
              description: `Revisão periódica do documento SST aprovado. Validade: ${validUntil.toLocaleDateString("pt-BR")}.`,
              priority: "MEDIA",
              dueDate: validUntil,
              companyId: draft.companyId,
              assignedToUserId: draft.technicalResponsibleUserId,
              createdByUserId: session.user.id,
              origin: "DOCUMENTO",
              linkUrl: `/dashboard/assistente-sst?id=${draft.id}&tab=aprovados`,
              systemGenerated: true,
              sourceKey,
            },
            clinicId
          ),
        });
      }
    }

    await createAuditLog({
      action: "UPDATE",
      entity: "SstDraft",
      entityId: draft.id,
      details: `publishedDocumentId=${doc.id}`,
    });
    revalidateSst();
    return { success: true, id: doc.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao finalizar documento.") };
  }
}

export async function generateSstAssistedPreview(id: string) {
  const detail = await getSstDraftDetail(id);
  if (!detail) return { success: false as const, error: "Documento não encontrado." };
  return { success: true as const, preview: detail.preview };
}
