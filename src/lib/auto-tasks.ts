import "server-only";

import { prisma } from "@/lib/prisma";
import type { TaskPriority } from "@prisma/client";
import { addDays, startOfDay } from "date-fns";
import { withClinicId } from "@/lib/scoped-db";

export type TaskOrigin =
  | "EMPRESA"
  | "COLABORADOR"
  | "FECHAMENTO"
  | "DOCUMENTO"
  | "COMERCIAL"
  | "FINANCEIRO"
  | "CHAMADO"
  | "MANUAL";

/** Cria tarefa automática vinculada a um módulo (deduplicada por sourceKey). */
export async function createAutoTask(input: {
  clinicId: string | null;
  createdByUserId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  companyId?: string;
  assignedToUserId?: string;
  origin?: TaskOrigin;
  linkUrl?: string;
  sourceKey?: string;
}) {
  if (input.sourceKey) {
    const existing = await prisma.task.findFirst({
      where: {
        sourceKey: input.sourceKey,
        status: { in: ["PENDENTE", "EM_ANDAMENTO"] },
        ...(input.clinicId ? { clinicId: input.clinicId } : {}),
      },
      select: { id: true },
    });
    if (existing) return existing;
  }

  return prisma.task.create({
    data: withClinicId(
      {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        priority: input.priority ?? "MEDIA",
        dueDate: input.dueDate ?? null,
        companyId: input.companyId || null,
        assignedToUserId: input.assignedToUserId || null,
        createdByUserId: input.createdByUserId,
        status: "PENDENTE",
        origin: input.origin ?? "MANUAL",
        linkUrl: input.linkUrl ?? null,
        systemGenerated: true,
        sourceKey: input.sourceKey ?? null,
      },
      input.clinicId
    ),
  });
}

export async function getSettingBool(clinicId: string | null, key: string, defaultValue = false) {
  if (!clinicId) return defaultValue;
  const row = await prisma.setting.findUnique({
    where: { clinicId_key: { clinicId, key } },
  });
  if (!row) return defaultValue;
  return row.value === "true" || row.value === "1";
}

/**
 * Gera tarefas operacionais a partir de pendências reais do sistema.
 * Idempotente via sourceKey.
 */
export async function syncOperationalTasks(input: {
  clinicId: string | null;
  actorUserId: string;
}) {
  const scope = input.clinicId ? { clinicId: input.clinicId } : {};
  const now = new Date();
  const in7Days = addDays(startOfDay(now), 7);

  const pendingDocs = await prisma.document.findMany({
    where: {
      ...scope,
      status: { in: ["PENDENTE", "EM_ELABORACAO", "EM_EMISSAO"] },
    },
    select: { id: true, title: true, companyId: true },
    take: 40,
  });

  for (const doc of pendingDocs) {
    await createAutoTask({
      clinicId: input.clinicId,
      createdByUserId: input.actorUserId,
      title: `Documento pendente: ${doc.title}`,
      description: "Documento obrigatório ainda pendente de emissão/entrega.",
      priority: "ALTA",
      companyId: doc.companyId ?? undefined,
      origin: "DOCUMENTO",
      linkUrl: `/dashboard/documentos`,
      sourceKey: `doc-pending:${doc.id}`,
      dueDate: addDays(now, 3),
    });
  }

  const expiringDocs = await prisma.document.findMany({
    where: {
      ...scope,
      status: { in: ["DISPONIVEL", "ENTREGUE", "EM_DIA", "ENVIADO"] },
      validUntil: { gte: startOfDay(now), lte: in7Days },
    },
    select: { id: true, title: true, companyId: true, validUntil: true },
    take: 40,
  });

  for (const doc of expiringDocs) {
    await createAutoTask({
      clinicId: input.clinicId,
      createdByUserId: input.actorUserId,
      title: `Documento próximo do vencimento: ${doc.title}`,
      description: "Documento com validade próxima. Regularize antes do vencimento.",
      priority: "ALTA",
      companyId: doc.companyId ?? undefined,
      origin: "DOCUMENTO",
      linkUrl: `/dashboard/documentos`,
      sourceKey: `doc-expiring:${doc.id}`,
      dueDate: doc.validUntil ?? in7Days,
    });
  }

  const closings = await prisma.monthlyClosing.findMany({
    where: {
      ...scope,
      status: { in: ["EM_CONFERENCIA", "COM_DIVERGENCIA", "AGUARDANDO_APROVACAO"] },
      OR: [{ withoutPriceCount: { gt: 0 } }, { divergenceCount: { gt: 0 } }],
    },
    select: {
      id: true,
      companyId: true,
      withoutPriceCount: true,
      divergenceCount: true,
    },
    take: 40,
  });

  for (const closing of closings) {
    if (closing.withoutPriceCount > 0) {
      await createAutoTask({
        clinicId: input.clinicId,
        createdByUserId: input.actorUserId,
        title: "Item sem preço no fechamento",
        description: `${closing.withoutPriceCount} item(ns) sem preço na conferência.`,
        priority: "URGENTE",
        companyId: closing.companyId ?? undefined,
        origin: "FECHAMENTO",
        linkUrl: `/dashboard/fechamento-mensal`,
        sourceKey: `closing-no-price:${closing.id}`,
        dueDate: addDays(now, 1),
      });
    }
    if (closing.divergenceCount > 0) {
      await createAutoTask({
        clinicId: input.clinicId,
        createdByUserId: input.actorUserId,
        title: "Divergência de fechamento",
        description: `${closing.divergenceCount} divergência(s) a corrigir antes de fechar.`,
        priority: "URGENTE",
        companyId: closing.companyId ?? undefined,
        origin: "FECHAMENTO",
        linkUrl: `/dashboard/fechamento-mensal`,
        sourceKey: `closing-div:${closing.id}`,
        dueDate: addDays(now, 1),
      });
    }
  }

  const overdueFollowUps = await prisma.commercialFollowUp.findMany({
    where: {
      status: "PENDENTE",
      dueAt: { lt: startOfDay(now) },
      lead: input.clinicId ? { clinicId: input.clinicId } : undefined,
    },
    select: {
      id: true,
      action: true,
      lead: { select: { companyName: true, name: true } },
    },
    take: 40,
  });

  for (const fu of overdueFollowUps) {
    await createAutoTask({
      clinicId: input.clinicId,
      createdByUserId: input.actorUserId,
      title: `Follow-up comercial vencido: ${fu.action}`,
      description: fu.lead.companyName || fu.lead.name || "Follow-up comercial em atraso.",
      priority: "ALTA",
      origin: "COMERCIAL",
      linkUrl: `/dashboard/orcamentos`,
      sourceKey: `followup-overdue:${fu.id}`,
      dueDate: now,
    });
  }

  const overdueReceivables = await prisma.financialEntry.findMany({
    where: {
      ...scope,
      type: "RECEBER",
      status: { in: ["PENDENTE", "ATRASADO", "PARCIAL", "AGUARDANDO_FATURAMENTO"] },
      dueDate: { lt: startOfDay(now) },
    },
    select: { id: true, description: true, companyId: true },
    take: 40,
  });

  for (const entry of overdueReceivables) {
    await createAutoTask({
      clinicId: input.clinicId,
      createdByUserId: input.actorUserId,
      title: "Conta a receber vencida",
      description: entry.description,
      priority: "URGENTE",
      companyId: entry.companyId ?? undefined,
      origin: "FINANCEIRO",
      linkUrl: `/dashboard/financeiro`,
      sourceKey: `receivable-overdue:${entry.id}`,
      dueDate: now,
    });
  }

  const portalPending = await prisma.company.findMany({
    where: {
      ...scope,
      status: "ATIVA",
      portalEnabled: false,
      users: { none: {} },
    },
    select: { id: true, tradeName: true, legalName: true },
    take: 20,
  });

  for (const company of portalPending) {
    await createAutoTask({
      clinicId: input.clinicId,
      createdByUserId: input.actorUserId,
      title: "Configuração pendente do portal",
      description: `Portal RH ainda não configurado para ${company.tradeName ?? company.legalName}.`,
      priority: "MEDIA",
      companyId: company.id,
      origin: "EMPRESA",
      linkUrl: `/dashboard/empresas/${company.id}?tab=portal`,
      sourceKey: `portal-pending:${company.id}`,
      dueDate: addDays(now, 7),
    });
  }
}
