"use server";

import { prisma } from "@/lib/prisma";
import { isPrismaSchemaError } from "@/lib/authz";
import {
  buildPreReferralWhere,
  type PreReferralListFilters,
  type PreReferralListItem,
} from "@/lib/pre-referrals";
import type { PreReferralStatus } from "@prisma/client";

export async function loadPreReferralsPageData(filters: PreReferralListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(10, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;
  const where = buildPreReferralWhere(filters);

  try {
    const statStatuses: PreReferralStatus[] = ["NOVO", "EM_ANALISE", "CONVERTIDO"];

    const [total, requests, countResults] = await Promise.all([
      prisma.publicReferralRequest.count({ where }),
      prisma.publicReferralRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      Promise.all(
        statStatuses.map(async (status) => ({
          status,
          count: await prisma.publicReferralRequest.count({ where: { status } }),
        }))
      ),
    ]);

    const items: PreReferralListItem[] = requests.map((r) => ({
      id: r.id,
      protocol: r.protocol,
      companyName: r.companyName,
      employeeName: r.employeeName,
      employeeRole: r.employeeRole,
      clinicalExamType: r.clinicalExamType,
      whatsapp: r.whatsapp,
      email: r.email,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      selectedExamsCount: r.selectedExams.length,
    }));

    const statusCounts = Object.fromEntries(
      countResults.map((c) => [c.status, c.count])
    ) as Partial<Record<PreReferralStatus, number>>;

    return {
      success: true as const,
      dbReady: true,
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      statusCounts,
    };
  } catch (error) {
    if (isPrismaSchemaError(error)) {
      return {
        success: true as const,
        dbReady: false,
        items: [] as PreReferralListItem[],
        total: 0,
        page: 1,
        pageSize,
        totalPages: 0,
        statusCounts: {} as Partial<Record<PreReferralStatus, number>>,
      };
    }
    console.error("loadPreReferralsPageData error:", error);
    return {
      success: false as const,
      error: "Não foi possível carregar os pré-encaminhamentos.",
    };
  }
}

export async function getPreReferralDetail(id: string) {
  try {
    const request = await prisma.publicReferralRequest.findUnique({ where: { id } });
    if (!request) return { success: false as const, error: "Pré-encaminhamento não encontrado." };

    let convertedReferral: { id: string; protocol: string } | null = null;
    try {
      convertedReferral = await prisma.referral.findFirst({
        where: { preReferralId: id },
        select: { id: true, protocol: true },
      });
    } catch {
      convertedReferral = null;
    }

    return {
      success: true as const,
      request: {
        id: request.id,
        protocol: request.protocol,
        companyName: request.companyName,
        companyDocument: request.companyDocument,
        responsibleName: request.responsibleName,
        whatsapp: request.whatsapp,
        email: request.email,
        employeeName: request.employeeName,
        employeeDocument: request.employeeDocument,
        employeeRole: request.employeeRole,
        clinicalExamType: request.clinicalExamType,
        examSelectionMode: request.examSelectionMode,
        selectedExams: request.selectedExams,
        notes: request.notes,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        convertedReferral,
      },
    };
  } catch (error) {
    if (isPrismaSchemaError(error)) {
      return {
        success: false as const,
        error: "Módulo ainda não configurado no banco de dados. Execute as migrations.",
      };
    }
    return { success: false as const, error: "Erro ao carregar detalhes." };
  }
}
