import type { Prisma } from "@prisma/client";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  User: "Usuário",
  Company: "Empresa",
  Patient: "Colaborador",
  Referral: "Encaminhamento",
  Document: "Documento",
  Quote: "Orçamento",
  Lead: "Solicitação comercial",
  Appointment: "Agendamento",
  Task: "Tarefa",
  Ticket: "Chamado",
  FinancialEntry: "Lançamento financeiro",
  MonthlyClosing: "Fechamento mensal",
  PriceListItem: "Tabela de preços",
  ProductionImport: "Importação de produção",
  BlogPost: "Publicação",
  Setting: "Configuração",
  Exam: "Exame",
  PublicReferralRequest: "Pré-encaminhamento",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  UPSERT: "Salvamento",
  LOGIN: "Login",
  LOGOUT: "Logout",
  STATUS_CHANGE: "Alteração de status",
  DOWNLOAD: "Download",
  VIEW: "Visualização",
};

export const CRITICAL_ENTITIES = new Set([
  "User",
  "FinancialEntry",
  "Document",
  "Setting",
  "PriceListItem",
]);

export type AuditFilters = {
  q?: string;
  entity?: string;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
};

const PAGE_SIZE = 50;

export function getAuditPageSize() {
  return PAGE_SIZE;
}

export function buildAuditWhere(filters: AuditFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { details: { contains: q, mode: "insensitive" } },
      { entity: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.entity && filters.entity !== "ALL") where.entity = filters.entity;
  if (filters.action && filters.action !== "ALL") where.action = filters.action;
  if (filters.userId) where.userId = filters.userId;

  const range: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) {
    const d = parseISO(filters.dateFrom);
    if (isValid(d)) range.gte = startOfDay(d);
  }
  if (filters.dateTo) {
    const d = parseISO(filters.dateTo);
    if (isValid(d)) range.lte = endOfDay(d);
  }
  if (Object.keys(range).length) where.createdAt = range;

  return where;
}

export function translateEntity(entity: string) {
  return AUDIT_ENTITY_LABELS[entity] ?? entity;
}

export function translateAction(action: string) {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function isCriticalAudit(entity: string, action: string) {
  return CRITICAL_ENTITIES.has(entity) || action === "DELETE";
}
