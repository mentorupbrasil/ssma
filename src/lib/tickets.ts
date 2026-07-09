import type { Prisma, TicketPriority, TicketStatus } from "@prisma/client";
import { differenceInHours } from "date-fns";

export const TICKET_STAT_CARDS: { key: string; status?: TicketStatus; label: string }[] = [
  { key: "abertos", status: "ABERTO", label: "Abertos" },
  { key: "em_atendimento", status: "EM_ATENDIMENTO", label: "Em atendimento" },
  { key: "aguardando", status: "AGUARDANDO_CLIENTE", label: "Aguardando cliente" },
  { key: "resolvidos", status: "RESOLVIDO", label: "Resolvidos" },
  { key: "fechados", status: "FECHADO", label: "Fechados" },
  { key: "alta_prioridade", label: "Alta prioridade" },
];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  ABERTO: "Aberto",
  EM_ATENDIMENTO: "Em atendimento",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export const TICKET_CATEGORIES = [
  "Suporte técnico",
  "Acesso e permissões",
  "Documentos",
  "Financeiro",
  "Agendamento",
  "Portal empresarial",
  "Outro",
] as const;

/** SLA em horas por prioridade */
export const TICKET_SLA_HOURS: Record<TicketPriority, number> = {
  BAIXA: 72,
  MEDIA: 48,
  ALTA: 24,
};

export type TicketFilters = {
  q?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  card?: string;
  page?: number;
};

const PAGE_SIZE = 20;

export function getTicketPageSize() {
  return PAGE_SIZE;
}

export function buildTicketWhere(filters: TicketFilters, scope: "CLINIC" | "SAAS" = "CLINIC"): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = { scope };
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as TicketStatus;
  }
  if (filters.priority && filters.priority !== "ALL") {
    where.priority = filters.priority as TicketPriority;
  }
  if (filters.category && filters.category !== "ALL") {
    where.category = filters.category;
  }
  if (filters.assignedTo) where.assignedToUserId = filters.assignedTo;

  const card = filters.card;
  if (card === "abertos") where.status = "ABERTO";
  if (card === "em_atendimento") where.status = "EM_ATENDIMENTO";
  if (card === "aguardando") where.status = "AGUARDANDO_CLIENTE";
  if (card === "resolvidos") where.status = "RESOLVIDO";
  if (card === "fechados") where.status = "FECHADO";
  if (card === "alta_prioridade") {
    where.priority = "ALTA";
    where.status = { in: ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] };
  }

  return where;
}

export function getTicketSlaStatus(ticket: {
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
}): "ok" | "warning" | "breached" | "closed" {
  if (ticket.status === "RESOLVIDO" || ticket.status === "FECHADO") return "closed";
  const hours = differenceInHours(new Date(), ticket.createdAt);
  const sla = TICKET_SLA_HOURS[ticket.priority];
  if (hours >= sla) return "breached";
  if (hours >= sla * 0.75) return "warning";
  return "ok";
}
