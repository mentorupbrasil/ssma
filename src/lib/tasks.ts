import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";

export const TASK_STAT_CARDS: { key: string; status?: TaskStatus; label: string }[] = [
  { key: "pendentes", status: "PENDENTE", label: "Pendentes" },
  { key: "em_andamento", status: "EM_ANDAMENTO", label: "Em andamento" },
  { key: "concluidas", status: "CONCLUIDA", label: "Concluídas" },
  { key: "atrasadas", keyFilter: "overdue", label: "Atrasadas" } as { key: string; label: string; status?: TaskStatus; keyFilter?: string },
  { key: "hoje", keyFilter: "today", label: "Vencem hoje" } as { key: string; label: string; status?: TaskStatus; keyFilter?: string },
  { key: "urgentes", keyFilter: "urgent", label: "Urgentes" } as { key: string; label: string; status?: TaskStatus; keyFilter?: string },
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const KANBAN_COLUMNS: TaskStatus[] = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"];

export type TaskFilters = {
  q?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  companyId?: string;
  card?: string;
  page?: number;
};

const PAGE_SIZE = 50;

export function getTaskPageSize() {
  return PAGE_SIZE;
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
  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as TaskStatus;
  }
  if (filters.priority && filters.priority !== "ALL") {
    where.priority = filters.priority as TaskPriority;
  }
  if (filters.assignedTo) where.assignedToUserId = filters.assignedTo;
  if (filters.companyId) where.companyId = filters.companyId;

  const now = new Date();
  const card = filters.card;
  if (card === "pendentes") where.status = "PENDENTE";
  if (card === "em_andamento") where.status = "EM_ANDAMENTO";
  if (card === "concluidas") where.status = "CONCLUIDA";
  if (card === "overdue") {
    where.status = { in: ["PENDENTE", "EM_ANDAMENTO"] };
    where.dueDate = { lt: startOfDay(now) };
  }
  if (card === "today") {
    where.status = { in: ["PENDENTE", "EM_ANDAMENTO"] };
    where.dueDate = { gte: startOfDay(now), lte: endOfDay(now) };
  }
  if (card === "urgentes") {
    where.priority = "URGENTE";
    where.status = { in: ["PENDENTE", "EM_ANDAMENTO"] };
  }

  return where;
}

export function parseTaskDueDate(date?: string) {
  if (!date) return undefined;
  const d = parseISO(date);
  return isValid(d) ? d : undefined;
}
