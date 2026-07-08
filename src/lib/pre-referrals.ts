import type { PreReferralStatus } from "@prisma/client";
import { PRE_REFERRAL_STATUS_LABELS } from "@/types";

export const PRE_REFERRAL_STAT_CARDS: { status: PreReferralStatus; label: string }[] = [
  { status: "NOVO", label: "Novos" },
  { status: "EM_ANALISE", label: "Em análise" },
  { status: "CONVERTIDO", label: "Convertidos" },
];

export const PRE_REFERRAL_STATUS_TABS: { value: PreReferralStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "NOVO", label: "Novos" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "CONVERTIDO", label: "Convertidos" },
  { value: "CANCELADO", label: "Cancelados" },
];

export type PreReferralListItem = {
  id: string;
  protocol: string;
  companyName: string;
  employeeName: string;
  employeeRole: string;
  clinicalExamType: string;
  whatsapp: string;
  email: string | null;
  status: PreReferralStatus;
  createdAt: string;
  selectedExamsCount: number;
};

export type PreReferralListFilters = {
  q?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export function buildPreReferralWhere(filters: PreReferralListFilters) {
  const where: {
    status?: PreReferralStatus;
    createdAt?: { gte?: Date; lte?: Date };
    OR?: Array<Record<string, unknown>>;
  } = {};

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as PreReferralStatus;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const digits = q.replace(/\D/g, "");
    where.OR = [
      { protocol: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { employeeName: { contains: q, mode: "insensitive" } },
      { responsibleName: { contains: q, mode: "insensitive" } },
      ...(digits.length >= 3
        ? [
            { companyDocument: { contains: digits } },
            { employeeDocument: { contains: digits } },
          ]
        : []),
    ];
  }

  return where;
}

export function getPreReferralStatusLabel(status: PreReferralStatus): string {
  return PRE_REFERRAL_STATUS_LABELS[status] ?? status;
}
