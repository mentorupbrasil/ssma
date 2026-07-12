import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { startOfDay, endOfDay, addDays, parseISO, isValid } from "date-fns";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Normal",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const TASK_ORIGIN_LABELS: Record<string, string> = {
  EMPRESA: "Empresa",
  COLABORADOR: "Colaborador",
  FECHAMENTO: "Fechamento mensal",
  DOCUMENTO: "Documento",
  COMERCIAL: "Comercial",
  FINANCEIRO: "Financeiro",
  CHAMADO: "Chamado",
  MANUAL: "Manual",
};

export const KANBAN_COLUMNS: TaskStatus[] = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"];

export type TaskFilters = {
  q?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  due?: string;
  origin?: string;
  companyId?: string;
  page?: number;
};

const PAGE_SIZE = 50;

export function getTaskPageSize() {
  return PAGE_SIZE;
}

export function taskOriginLabel(origin: string | null | undefined, companyName?: string | null) {
  if (!origin) {
    return companyName ? `Empresa · ${companyName}` : "—";
  }
  const base = TASK_ORIGIN_LABELS[origin] ?? origin;
  if (origin === "EMPRESA" && companyName) return `${base} · ${companyName}`;
  if (companyName && origin !== "MANUAL") return `${base} · ${companyName}`;
  return base;
}

export function isTaskOverdue(dueDate: string | Date | null | undefined, status: string) {
  if (!dueDate || status === "CONCLUIDA" || status === "CANCELADA") return false;
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (Number.isNaN(due.getTime())) return false;
  return due < startOfDay(new Date());
}

export function buildTaskWhere(filters: TaskFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.status) where.status = filters.status as TaskStatus;
  if (filters.priority) where.priority = filters.priority as TaskPriority;
  if (filters.assignedTo) where.assignedToUserId = filters.assignedTo;
  if (filters.companyId) where.companyId = filters.companyId;
  if (filters.origin) where.origin = filters.origin;

  const now = new Date();
  if (filters.due === "atrasadas") {
    where.status = { in: ["PENDENTE", "EM_ANDAMENTO"] };
    where.dueDate = { lt: startOfDay(now) };
  } else if (filters.due === "hoje") {
    where.status = { in: ["PENDENTE", "EM_ANDAMENTO"] };
    where.dueDate = { gte: startOfDay(now), lte: endOfDay(now) };
  } else if (filters.due === "semana") {
    where.status = { in: ["PENDENTE", "EM_ANDAMENTO"] };
    where.dueDate = { gte: startOfDay(now), lte: endOfDay(addDays(now, 7)) };
  }

  return where;
}

export function parseTaskDueDate(date?: string) {
  if (!date) return undefined;
  const d = parseISO(date);
  return isValid(d) ? d : undefined;
}
