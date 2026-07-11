"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type {
  ClinicalExamType,
  DocumentHistoryAction,
  DocumentStatus,
  DocumentType,
} from "@prisma/client";
import { requirePermission, assertCompanyAccess, type AuthSession } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import {
  buildDocumentWhere,
  buildDocumentOrderBy,
  getDocumentPageSize,
  serializeDocumentListItem,
  canViewDocument,
  CLINICAL_DOCUMENT_TYPES,
  PENDING_DOCUMENT_STATUSES,
  type DocumentListFilters,
  type DocumentDetailSerialized,
  type DocumentHistoryItem,
  type DocumentFormOptions,
} from "@/lib/documents";
import {
  applyEmpresaDocumentCardFilter,
  applyEmpresaDocumentStatusFilter,
  empresaDocumentDownloadableWhere,
} from "@/lib/empresa-portal";
import { deleteDocumentFile } from "@/lib/document-storage";

type ActionResult<T extends Record<string, unknown> = {}> =
  | ({ success: true } & T)
  | { success: false; error: string };

async function recordDocHistory(
  documentId: string,
  action: DocumentHistoryAction,
  userId: string,
  notes?: string
) {
  await prisma.documentHistory.create({
    data: {
      documentId,
      action,
      notes: notes?.trim() || null,
      performedByUserId: userId,
    },
  });
}

async function assertDocumentAccess(session: AuthSession, documentId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      sensitive: true,
      type: true,
      companyId: true,
      availableOnPortal: true,
    },
  });
  if (!doc) throw new Error("Documento não encontrado.");
  if (!canViewDocument(session.user.role, doc, session.user.companyId)) {
    throw new Error("FORBIDDEN");
  }
  if (session.user.role === "EMPRESA" && doc.companyId) {
    await assertCompanyAccess(session, doc.companyId);
  }
  return doc;
}

async function maybeUpdateReferralOnAso(referralId: string | null, userId: string) {
  if (!referralId) return;
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    select: { status: true },
  });
  if (!referral || referral.status === "ASO_DISPONIVEL" || referral.status === "CONCLUIDO") return;

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referralId },
      data: { status: "ASO_DISPONIVEL" },
    }),
    prisma.referralStatusHistory.create({
      data: {
        referralId,
        fromStatus: referral.status,
        toStatus: "ASO_DISPONIVEL",
        notes: "ASO disponibilizado via módulo Documentos",
        changedById: userId,
      },
    }),
  ]);
}

function revalidateDocumentPaths() {
  revalidatePath("/dashboard/documentos");
  revalidatePath("/dashboard/encaminhamentos");
  revalidatePath("/dashboard/empresas");
  revalidatePath("/dashboard/colaboradores");
}

export async function listDocumentsForDashboard(
  filters: DocumentListFilters = {},
  companyScope?: string
) {
  const pageSize = getDocumentPageSize();
  const page = Math.max(1, filters.page ?? 1);
  const where = buildDocumentWhere(filters, companyScope);
  const orderBy = buildDocumentOrderBy(filters.sort);
  const baseWhere = companyScope ? { companyId: companyScope } : {};

  const [items, total, aguardandoArquivo, emElaboracao, disponiveis, vencidos] =
    await Promise.all([
      prisma.document.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          company: { select: { legalName: true, tradeName: true, whatsapp: true, phone: true } },
          patient: { select: { fullName: true } },
          referral: { select: { protocol: true } },
        },
      }),
      prisma.document.count({ where }),
      prisma.document.count({
        where: {
          ...baseWhere,
          OR: [
            { status: "PENDENTE" },
            {
              fileUrl: null,
              status: { notIn: ["ARQUIVADO", "CANCELADO", "VENCIDO"] },
            },
          ],
        },
      }),
      prisma.document.count({
        where: {
          ...baseWhere,
          status: { in: ["EM_EMISSAO", "EM_ELABORACAO"] },
        },
      }),
      prisma.document.count({
        where: {
          ...baseWhere,
          fileUrl: { not: null },
          status: { in: ["DISPONIVEL", "CONCLUIDO", "EM_DIA", "ENVIADO", "ENTREGUE"] },
        },
      }),
      prisma.document.count({ where: { ...baseWhere, status: "VENCIDO" } }),
    ]);

  return {
    items: items.map(serializeDocumentListItem),
    total,
    page,
    pageSize,
    statCounts: {
      aguardando_arquivo: aguardandoArquivo,
      em_elaboracao: emElaboracao,
      disponiveis,
      vencidos,
      // aliases legados
      pendentes: aguardandoArquivo,
      em_emissao: emElaboracao,
    },
  };
}

/** Lista documentos para o portal RH — foco em arquivos anexados pela clínica */
export async function listDocumentsForEmpresa(
  filters: DocumentListFilters = {},
  companyId: string
) {
  const pageSize = getDocumentPageSize();
  const page = Math.max(1, filters.page ?? 1);
  const empresaStatus = filters.status;
  let where = buildDocumentWhere(
    { ...filters, status: undefined },
    companyId,
    { omitProtocolSearch: true }
  );
  where = applyEmpresaDocumentCardFilter(where, filters.card);
  where = applyEmpresaDocumentStatusFilter(where, empresaStatus);
  const orderBy = buildDocumentOrderBy(filters.sort);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const base = { companyId };

  const [items, total, paraBaixar, aguardando, mes] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        company: { select: { legalName: true, tradeName: true, whatsapp: true, phone: true } },
        patient: { select: { fullName: true } },
        referral: { select: { protocol: true } },
      },
    }),
    prisma.document.count({ where }),
    prisma.document.count({ where: empresaDocumentDownloadableWhere(companyId) }),
    prisma.document.count({
      where: {
        ...base,
        fileUrl: null,
        status: {
          notIn: ["ARQUIVADO", "CANCELADO", "DISPONIVEL", "CONCLUIDO", "EM_DIA", "ENVIADO", "ENTREGUE"],
        },
      },
    }),
    prisma.document.count({
      where: {
        ...empresaDocumentDownloadableWhere(companyId),
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
  ]);

  return {
    items: items.map(serializeDocumentListItem),
    total,
    page,
    pageSize,
    statCounts: {
      para_baixar: paraBaixar,
      aguardando,
      mes,
    },
  };
}

export async function getDocumentDetail(
  id: string
): Promise<ActionResult<{ document: DocumentDetailSerialized }>> {
  try {
    const session = await requirePermission("documents.manage");
    await assertDocumentAccess(session, id);

    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        company: { select: { legalName: true, tradeName: true } },
        patient: { select: { fullName: true } },
        referral: { select: { protocol: true } },
        exam: { select: { name: true } },
        quote: { select: { quoteNumber: true } },
        uploadedBy: { select: { name: true } },
        history: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { performedBy: { select: { name: true } } },
        },
      },
    });
    if (!doc) return { success: false, error: "Documento não encontrado." };

    return {
      success: true,
      document: {
        ...serializeDocumentListItem(doc),
        fileUrl: doc.fileUrl,
        fileMimeType: doc.fileMimeType,
        fileSize: doc.fileSize,
        companyId: doc.companyId,
        patientId: doc.patientId,
        referralId: doc.referralId,
        examId: doc.examId,
        examName: doc.exam?.name ?? null,
        quoteId: doc.quoteId,
        quoteNumber: doc.quote?.quoteNumber ?? null,
        issuedAt: doc.issuedAt?.toISOString() ?? null,
        availableOnPortal: doc.availableOnPortal,
        uploadedByName: doc.uploadedBy?.name ?? null,
        notes: doc.notes,
        clientNotes: doc.clientNotes,
        asoClinicalType: doc.asoClinicalType,
        asoExamDate: doc.asoExamDate?.toISOString() ?? null,
        asoProfessionalName: doc.asoProfessionalName,
        history: doc.history.map((h) => ({
          id: h.id,
          action: h.action,
          notes: h.notes,
          performedByName: h.performedBy?.name ?? null,
          createdAt: h.createdAt.toISOString(),
        })),
      },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao carregar documento." };
  }
}

export type DocumentFormInput = {
  title: string;
  type: DocumentType;
  status?: DocumentStatus;
  issuedAt?: string | null;
  validUntil?: string | null;
  sensitive?: boolean;
  availableOnPortal?: boolean;
  companyId?: string | null;
  patientId?: string | null;
  referralId?: string | null;
  examId?: string | null;
  quoteId?: string | null;
  notes?: string;
  clientNotes?: string;
  asoClinicalType?: ClinicalExamType | null;
  asoExamDate?: string | null;
  asoProfessionalName?: string;
  fileName?: string | null;
  fileUrl?: string | null;
  fileMimeType?: string | null;
  fileSize?: number | null;
  makeAvailable?: boolean;
};

export async function createDocument(
  raw: DocumentFormInput
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const session = await requirePermission("documents.manage");
    if (!raw.title?.trim()) return { success: false, error: "Título obrigatório." };

    const status: DocumentStatus = raw.makeAvailable
      ? "DISPONIVEL"
      : raw.status ?? (raw.fileUrl ? "DISPONIVEL" : "PENDENTE");
    const sensitive = raw.sensitive ?? CLINICAL_DOCUMENT_TYPES.includes(raw.type);

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          title: raw.title.trim(),
          type: raw.type,
          status,
          issuedAt: raw.issuedAt ? new Date(raw.issuedAt) : null,
          validUntil: raw.validUntil ? new Date(raw.validUntil) : null,
          sensitive,
          availableOnPortal: raw.availableOnPortal ?? false,
          companyId: raw.companyId || null,
          patientId: raw.patientId || null,
          referralId: raw.referralId || null,
          examId: raw.examId || null,
          quoteId: raw.quoteId || null,
          notes: raw.notes?.trim() || null,
          clientNotes: raw.clientNotes?.trim() || null,
          asoClinicalType: raw.asoClinicalType ?? null,
          asoExamDate: raw.asoExamDate ? new Date(raw.asoExamDate) : null,
          asoProfessionalName: raw.asoProfessionalName?.trim() || null,
          fileName: raw.fileName || null,
          fileUrl: raw.fileUrl || null,
          fileMimeType: raw.fileMimeType || null,
          fileSize: raw.fileSize ?? null,
          uploadedByUserId: raw.fileUrl ? session.user.id : null,
        },
      });

      await tx.documentHistory.create({
        data: { documentId: created.id, action: "CREATED", performedByUserId: session.user.id },
      });
      if (raw.fileUrl) {
        await tx.documentHistory.create({
          data: {
            documentId: created.id,
            action: "FILE_ATTACHED",
            notes: raw.fileName ?? undefined,
            performedByUserId: session.user.id,
          },
        });
      }
      if (raw.availableOnPortal) {
        await tx.documentHistory.create({
          data: {
            documentId: created.id,
            action: "PORTAL_ENABLED",
            performedByUserId: session.user.id,
          },
        });
      }
      return created;
    });

    if (raw.type === "ASO" && status === "DISPONIVEL") {
      await maybeUpdateReferralOnAso(raw.referralId ?? null, session.user.id);
    }

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Document",
      entityId: doc.id,
      details: doc.title,
    });

    revalidateDocumentPaths();
    return { success: true, documentId: doc.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao criar documento." };
  }
}

export async function updateDocument(
  documentId: string,
  raw: DocumentFormInput
): Promise<ActionResult> {
  try {
    const session = await requirePermission("documents.manage");
    await assertDocumentAccess(session, documentId);

    const existing = await prisma.document.findUnique({ where: { id: documentId } });
    if (!existing) return { success: false, error: "Documento não encontrado." };

    const status = raw.makeAvailable ? "DISPONIVEL" : raw.status ?? existing.status;
    const fileReplaced = raw.fileUrl && raw.fileUrl !== existing.fileUrl;

    await prisma.document.update({
      where: { id: documentId },
      data: {
        title: raw.title.trim(),
        type: raw.type,
        status,
        issuedAt: raw.issuedAt ? new Date(raw.issuedAt) : null,
        validUntil: raw.validUntil ? new Date(raw.validUntil) : null,
        sensitive: raw.sensitive ?? existing.sensitive,
        availableOnPortal: raw.availableOnPortal ?? existing.availableOnPortal,
        companyId: raw.companyId || null,
        patientId: raw.patientId || null,
        referralId: raw.referralId || null,
        examId: raw.examId || null,
        quoteId: raw.quoteId || null,
        notes: raw.notes?.trim() || null,
        clientNotes: raw.clientNotes?.trim() || null,
        asoClinicalType: raw.asoClinicalType ?? null,
        asoExamDate: raw.asoExamDate ? new Date(raw.asoExamDate) : null,
        asoProfessionalName: raw.asoProfessionalName?.trim() || null,
        ...(raw.fileUrl
          ? {
              fileName: raw.fileName,
              fileUrl: raw.fileUrl,
              fileMimeType: raw.fileMimeType,
              fileSize: raw.fileSize,
              uploadedByUserId: session.user.id,
            }
          : {}),
      },
    });

    if (existing.status !== status) {
      await recordDocHistory(documentId, "STATUS_CHANGED", session.user.id, `${existing.status} → ${status}`);
    }
    if (fileReplaced) {
      if (existing.fileUrl) await deleteDocumentFile(existing.fileUrl);
      await recordDocHistory(documentId, "FILE_REPLACED", session.user.id, raw.fileName ?? undefined);
    }

    if (raw.type === "ASO" && status === "DISPONIVEL") {
      await maybeUpdateReferralOnAso(raw.referralId ?? existing.referralId, session.user.id);
    }

    revalidateDocumentPaths();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao atualizar documento." };
  }
}

export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus
): Promise<ActionResult> {
  try {
    const session = await requirePermission("documents.manage");
    const existing = await prisma.document.findUnique({ where: { id: documentId } });
    if (!existing) return { success: false, error: "Documento não encontrado." };

    await prisma.document.update({ where: { id: documentId }, data: { status } });
    const action: DocumentHistoryAction = status === "ARQUIVADO" ? "ARCHIVED" : "STATUS_CHANGED";
    await recordDocHistory(documentId, action, session.user.id, `${existing.status} → ${status}`);

    if (existing.type === "ASO" && status === "DISPONIVEL") {
      await maybeUpdateReferralOnAso(existing.referralId, session.user.id);
    }

    revalidateDocumentPaths();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao alterar status." };
  }
}

export async function removeDocumentFile(documentId: string): Promise<ActionResult> {
  try {
    const session = await requirePermission("documents.manage");
    const existing = await prisma.document.findUnique({ where: { id: documentId } });
    if (!existing) return { success: false, error: "Documento não encontrado." };

    if (existing.fileUrl) await deleteDocumentFile(existing.fileUrl);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        fileName: null,
        fileUrl: null,
        fileMimeType: null,
        fileSize: null,
        status: existing.status === "DISPONIVEL" ? "PENDENTE" : existing.status,
      },
    });

    await recordDocHistory(documentId, "DELETED", session.user.id, existing.fileName ?? undefined);
    revalidateDocumentPaths();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao remover arquivo." };
  }
}

export async function attachFileToDocument(
  documentId: string,
  file: { fileName: string; fileUrl: string; fileMimeType: string; fileSize: number },
  makeAvailable?: boolean
): Promise<ActionResult> {
  try {
    const session = await requirePermission("documents.manage");
    const existing = await prisma.document.findUnique({ where: { id: documentId } });
    if (!existing) return { success: false, error: "Documento não encontrado." };

    if (existing.fileUrl) await deleteDocumentFile(existing.fileUrl);

    const status = makeAvailable ? "DISPONIVEL" : existing.status === "PENDENTE" ? "EM_EMISSAO" : existing.status;

    await prisma.document.update({
      where: { id: documentId },
      data: {
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileMimeType: file.fileMimeType,
        fileSize: file.fileSize,
        uploadedByUserId: session.user.id,
        status,
      },
    });

    await recordDocHistory(
      documentId,
      existing.fileUrl ? "FILE_REPLACED" : "FILE_ATTACHED",
      session.user.id,
      file.fileName
    );

    if (existing.type === "ASO" && status === "DISPONIVEL") {
      await maybeUpdateReferralOnAso(existing.referralId, session.user.id);
    }

    revalidateDocumentPaths();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao anexar arquivo." };
  }
}

export async function getDocumentFormOptions(): Promise<DocumentFormOptions> {
  await requirePermission("documents.manage");
  const [companies, patients, referrals, exams, quotes] = await Promise.all([
    prisma.company.findMany({
      where: { status: "ATIVA" },
      select: { id: true, legalName: true, tradeName: true },
      orderBy: { legalName: "asc" },
      take: 500,
    }),
    prisma.patient.findMany({
      where: { status: "ATIVO" },
      select: { id: true, fullName: true, companyId: true },
      orderBy: { fullName: "asc" },
      take: 500,
    }),
    prisma.referral.findMany({
      select: { id: true, protocol: true, patient: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.exam.findMany({
      where: { status: "ATIVO" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.quote.findMany({
      select: { id: true, quoteNumber: true, companyName: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return { companies, patients, referrals, exams, quotes };
}

export async function countPendingDocuments(companyScope?: string) {
  return prisma.document.count({
    where: {
      status: { in: PENDING_DOCUMENT_STATUSES },
      ...(companyScope ? { companyId: companyScope } : {}),
    },
  });
}

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  try {
    const session = await requirePermission("documents.manage");
    const existing = await prisma.document.findUnique({ where: { id: documentId } });
    if (!existing) return { success: false, error: "Documento não encontrado." };

    if (existing.fileUrl) await deleteDocumentFile(existing.fileUrl);

    await prisma.document.delete({ where: { id: documentId } });

    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "Document",
      entityId: documentId,
      details: existing.title,
    });

    revalidateDocumentPaths();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao remover documento." };
  }
}

export async function batchUpdateDocumentStatus(
  documentIds: string[],
  status: DocumentStatus
): Promise<ActionResult<{ updated: number }>> {
  try {
    const session = await requirePermission("documents.manage");
    if (!documentIds.length) return { success: false, error: "Nenhum documento selecionado." };

    let updated = 0;
    for (const id of documentIds) {
      const existing = await prisma.document.findUnique({ where: { id } });
      if (!existing) continue;
      await prisma.document.update({ where: { id }, data: { status } });
      await recordDocHistory(id, status === "ARQUIVADO" ? "ARCHIVED" : "STATUS_CHANGED", session.user.id, `${existing.status} → ${status}`);
      if (existing.type === "ASO" && status === "DISPONIVEL") {
        await maybeUpdateReferralOnAso(existing.referralId, session.user.id);
      }
      updated += 1;
    }

    revalidateDocumentPaths();
    return { success: true, updated };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro na ação em lote." };
  }
}

export async function batchArchiveDocuments(documentIds: string[]) {
  return batchUpdateDocumentStatus(documentIds, "ARQUIVADO");
}

export async function batchMarkDocumentsAvailable(documentIds: string[]) {
  return batchUpdateDocumentStatus(documentIds, "DISPONIVEL");
}
