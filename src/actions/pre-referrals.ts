"use server";

import { prisma } from "@/lib/prisma";
import { createAuditLog, generateProtocol } from "@/lib/server";
import { revalidatePath } from "next/cache";
import {
  requirePermission,
  actionError,
  isEmpresaUser,
  isPrismaSchemaError,
  isPrismaUniqueError,
} from "@/lib/authz";
import { preReferralStatusSchema } from "@/schemas";
import type { ClinicalExamType, ExamCategory, PreReferralStatus } from "@prisma/client";
import {
  buildPreReferralWhere,
  serializePreReferralDetail,
  PRE_REFERRAL_STAT_CARDS,
  type PreReferralListFilters,
  type PreReferralListItem,
} from "@/lib/pre-referrals";

type ActionResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

async function recordPreReferralHistory(params: {
  preReferralId: string;
  action: string;
  fromStatus?: PreReferralStatus | null;
  toStatus?: PreReferralStatus | null;
  notes?: string | null;
  performedById?: string | null;
}) {
  try {
    await prisma.preReferralHistory.create({
      data: {
        preReferralId: params.preReferralId,
        action: params.action,
        fromStatus: params.fromStatus ?? null,
        toStatus: params.toStatus ?? null,
        notes: params.notes?.trim() || null,
        performedById: params.performedById ?? null,
      },
    });
  } catch {
    // history table may not exist yet on legacy deploy
  }
}

const PRE_REFERRAL_INCLUDE = {
  assignedTo: true,
  history: { include: { performedBy: true }, orderBy: { createdAt: "desc" as const } },
  referral: { select: { id: true, protocol: true } },
};

export async function loadPreReferralsPageData(filters: PreReferralListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(10, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;
  const where = buildPreReferralWhere(filters);

  const sortBy = filters.sortBy ?? "createdAt";
  const sortDir = filters.sortDir ?? "desc";
  const orderBy =
    sortBy === "company"
      ? { companyName: sortDir as "asc" | "desc" }
      : sortBy === "status"
        ? { status: sortDir as "asc" | "desc" }
        : { createdAt: sortDir as "asc" | "desc" };

  try {
    const statStatuses = PRE_REFERRAL_STAT_CARDS.map((c) => c.status);

    const [total, requests, countResults] = await Promise.all([
      prisma.publicReferralRequest.count({ where }),
      prisma.publicReferralRequest.findMany({
        where,
        orderBy,
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
      responsibleName: r.responsibleName,
      employeeName: r.employeeName,
      employeeRole: r.employeeRole,
      clinicalExamType: r.clinicalExamType,
      whatsapp: r.whatsapp,
      email: r.email,
      status: r.status,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
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
    return { success: false as const, error: "Não foi possível carregar os pré-encaminhamentos." };
  }
}

export async function getPreReferralDetail(id: string) {
  try {
    const session = await requirePermission("referrals.manage");
    if (isEmpresaUser(session)) throw new Error("FORBIDDEN");

    const request = await prisma.publicReferralRequest.findUnique({
      where: { id },
      include: PRE_REFERRAL_INCLUDE,
    });
    if (!request) return { success: false as const, error: "Pré-encaminhamento não encontrado." };

    return { success: true as const, request: serializePreReferralDetail(request) };
  } catch (error) {
    if (isPrismaSchemaError(error)) {
      return {
        success: false as const,
        error: "Módulo ainda não configurado no banco. Aguarde o deploy das migrations.",
      };
    }
    return { success: false as const, error: actionError(error, "Erro ao carregar detalhes.") };
  }
}

export async function updatePreReferralStatusWithNotes(
  id: string,
  status: unknown,
  notes?: string
): Promise<ActionResult> {
  const parsed = preReferralStatusSchema.safeParse(status);
  if (!parsed.success) return { success: false, error: "Status inválido." };

  try {
    const session = await requirePermission("referrals.manage");
    if (isEmpresaUser(session)) throw new Error("FORBIDDEN");

    const current = await prisma.publicReferralRequest.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) return { success: false, error: "Pré-encaminhamento não encontrado." };
    if (current.status === parsed.data) return { success: true };

    await prisma.publicReferralRequest.update({
      where: { id },
      data: {
        status: parsed.data,
        assignedToId: session.user.id,
      },
    });

    await recordPreReferralHistory({
      preReferralId: id,
      action:
        parsed.data === "CANCELADO"
          ? "CANCELLED"
          : parsed.data === "CONVERTIDO"
            ? "CONVERTED"
            : "STATUS_CHANGED",
      fromStatus: current.status,
      toStatus: parsed.data,
      notes,
      performedById: session.user.id,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "PublicReferralRequest",
      entityId: id,
      details: `Status: ${current.status} → ${parsed.data}${notes ? ` — ${notes}` : ""}`,
    });

    revalidatePath("/dashboard/pre-encaminhamentos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao atualizar status.") };
  }
}

export async function addPreReferralInternalNote(
  id: string,
  note: string
): Promise<ActionResult> {
  if (!note.trim()) return { success: false, error: "Informe a observação." };

  try {
    const session = await requirePermission("referrals.manage");
    if (isEmpresaUser(session)) throw new Error("FORBIDDEN");

    const current = await prisma.publicReferralRequest.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) return { success: false, error: "Pré-encaminhamento não encontrado." };

    await recordPreReferralHistory({
      preReferralId: id,
      action: "INTERNAL_NOTE",
      fromStatus: current.status,
      toStatus: current.status,
      notes: note.trim(),
      performedById: session.user.id,
    });

    revalidatePath("/dashboard/pre-encaminhamentos");
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao salvar observação.") };
  }
}

export async function logPreReferralWhatsApp(id: string): Promise<ActionResult> {
  try {
    const session = await requirePermission("referrals.manage");
    if (isEmpresaUser(session)) throw new Error("FORBIDDEN");

    const current = await prisma.publicReferralRequest.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) return { success: false, error: "Pré-encaminhamento não encontrado." };

    await recordPreReferralHistory({
      preReferralId: id,
      action: "WHATSAPP",
      fromStatus: current.status,
      toStatus: current.status,
      notes: "Contato via WhatsApp",
      performedById: session.user.id,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao registrar contato.") };
  }
}

export async function checkPreReferralDuplicates(preReferralId: string) {
  try {
    await requirePermission("referrals.manage");

    const pre = await prisma.publicReferralRequest.findUnique({
      where: { id: preReferralId },
    });
    if (!pre) return { success: false as const, error: "Pré-encaminhamento não encontrado." };

    const docDigits = pre.companyDocument?.replace(/\D/g, "") ?? "";
    const cpfDigits = pre.employeeDocument?.replace(/\D/g, "") ?? "";

    const [similarCompanies, similarPatients, recentReferrals] = await Promise.all([
      docDigits
        ? prisma.company.findMany({
            where: { cnpj: docDigits },
            take: 3,
            select: { id: true, legalName: true, tradeName: true, cnpj: true },
          })
        : prisma.company.findMany({
            where: {
              OR: [
                { legalName: { contains: pre.companyName, mode: "insensitive" } },
                { tradeName: { contains: pre.companyName, mode: "insensitive" } },
              ],
            },
            take: 3,
            select: { id: true, legalName: true, tradeName: true, cnpj: true },
          }),
      cpfDigits
        ? prisma.patient.findMany({
            where: { cpf: cpfDigits },
            take: 3,
            select: { id: true, fullName: true, cpf: true, companyId: true },
          })
        : Promise.resolve([]),
      prisma.referral.findMany({
        where: {
          patient: { fullName: { equals: pre.employeeName, mode: "insensitive" } },
          ...(pre.clinicalExamType !== "NAO_SEI_INFORMAR"
            ? { clinicalExamType: pre.clinicalExamType as ClinicalExamType }
            : {}),
          createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
        },
        include: { company: true, patient: true },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const hasDuplicates =
      similarCompanies.length > 0 || similarPatients.length > 0 || recentReferrals.length > 0;

    return {
      success: true as const,
      hasDuplicates,
      similarCompanies,
      similarPatients,
      recentReferrals: recentReferrals.map((r) => ({
        id: r.id,
        protocol: r.protocol,
        companyName: r.company.tradeName ?? r.company.legalName,
        employeeName: r.patient.fullName,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    return { success: false as const, error: actionError(error, "Erro ao verificar duplicidades.") };
  }
}

export type ConvertPreReferralInput = {
  companyId?: string;
  createCompany?: boolean;
  patientId?: string;
  createPatient?: boolean;
  clinicalExamType?: ClinicalExamType;
  complementaryExams?: string[];
  notes?: string;
  desiredDate?: string;
  assignedToId?: string;
};

export async function convertPreReferralWithOptions(
  preReferralId: string,
  input: ConvertPreReferralInput = {}
): Promise<ActionResult<{ referralId: string; protocol: string }>> {
  try {
    const session = await requirePermission("referrals.manage");
    if (isEmpresaUser(session)) throw new Error("FORBIDDEN");

    const pre = await prisma.publicReferralRequest.findUnique({
      where: { id: preReferralId },
    });
    if (!pre) return { success: false, error: "Pré-encaminhamento não encontrado." };
    if (pre.status === "CONVERTIDO") {
      return { success: false, error: "Este pré-encaminhamento já foi convertido." };
    }

    const clinicalTypeMap: Record<string, ClinicalExamType> = {
      ADMISSIONAL: "ADMISSIONAL",
      DEMISSIONAL: "DEMISSIONAL",
      PERIODICO: "PERIODICO",
      RETORNO_TRABALHO: "RETORNO_TRABALHO",
      MUDANCA_FUNCAO: "MUDANCA_FUNCAO",
      NAO_SEI_INFORMAR: "ADMISSIONAL",
    };

    const clinicalExamType =
      input.clinicalExamType ??
      clinicalTypeMap[pre.clinicalExamType] ??
      "ADMISSIONAL";

    let company = input.companyId
      ? await prisma.company.findUnique({ where: { id: input.companyId } })
      : pre.companyDocument
        ? await prisma.company.findFirst({
            where: { cnpj: pre.companyDocument.replace(/\D/g, "") },
          })
        : null;

    if (!company && (input.createCompany !== false)) {
      const cnpj =
        pre.companyDocument?.replace(/\D/g, "") ||
        `PRE${Date.now()}`.slice(0, 14).padEnd(14, "0");
      company = await prisma.company.create({
        data: {
          legalName: pre.companyName,
          tradeName: pre.companyName,
          cnpj,
          email: pre.email,
          phone: pre.whatsapp,
          whatsapp: pre.whatsapp,
          responsibleName: pre.responsibleName,
          status: "ATIVA",
        },
      });
    }

    if (!company) {
      return { success: false, error: "Selecione ou cadastre uma empresa para continuar." };
    }

    let patient = input.patientId
      ? await prisma.patient.findUnique({ where: { id: input.patientId } })
      : null;

    if (!patient && pre.employeeDocument) {
      patient = await prisma.patient.findUnique({
        where: { cpf: pre.employeeDocument.replace(/\D/g, "") },
      });
    }

    if (!patient && (input.createPatient !== false)) {
      const cpf =
        pre.employeeDocument?.replace(/\D/g, "") ||
        `9${String(Date.now()).slice(-10)}`.padStart(11, "1");
      patient = await prisma.patient.create({
        data: {
          fullName: pre.employeeName,
          cpf,
          jobTitle: pre.employeeRole,
          companyId: company.id,
          status: "ATIVA",
        },
      });
    }

    if (!patient) {
      return { success: false, error: "Selecione ou cadastre um colaborador para continuar." };
    }

    const examNames =
      input.complementaryExams ??
      (pre.examSelectionMode === "SELECIONAR" ? pre.selectedExams : []);

    const examItems = examNames.map((name) => ({
      examName: name,
      category: "COMPLEMENTAR" as ExamCategory,
      status: "PENDENTE" as const,
    }));

    const protocol = await generateProtocol();
    const assignedToId = input.assignedToId ?? session.user.id;

    const referral = await prisma.referral.create({
      data: {
        protocol,
        companyId: company.id,
        patientId: patient.id,
        clinicalExamType,
        status: "NOVO",
        authorizerName: pre.responsibleName,
        companyPhone: pre.whatsapp,
        companyEmail: pre.email,
        internalNotes: [pre.notes, input.notes].filter(Boolean).join("\n") || null,
        consentAccepted: pre.consentAccepted,
        source: "PRE_REFERRAL",
        preReferralId: pre.id,
        assignedToId,
        exams: { create: examItems },
        statusHistory: {
          create: {
            toStatus: "NOVO",
            notes: `Convertido do pré-encaminhamento ${pre.protocol}`,
            changedById: session.user.id,
          },
        },
      },
    });

    await prisma.publicReferralRequest.update({
      where: { id: pre.id },
      data: {
        status: "CONVERTIDO",
        convertedReferralId: referral.id,
        assignedToId,
      },
    });

    await recordPreReferralHistory({
      preReferralId: pre.id,
      action: "CONVERTED",
      fromStatus: pre.status,
      toStatus: "CONVERTIDO",
      notes: `Encaminhamento oficial ${protocol} criado`,
      performedById: session.user.id,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Referral",
      entityId: referral.id,
      details: `Convertido de ${pre.protocol} → ${protocol}`,
    });

    revalidatePath("/dashboard/encaminhamentos");
    revalidatePath("/dashboard/pre-encaminhamentos");
    revalidatePath("/dashboard");
    return { success: true, referralId: referral.id, protocol };
  } catch (error) {
    console.error("convertPreReferralWithOptions error:", error);
    if (isPrismaUniqueError(error)) {
      return { success: false, error: "Conflito de dados ao converter. Verifique CNPJ/CPF." };
    }
    return { success: false, error: actionError(error, "Erro ao converter pré-encaminhamento.") };
  }
}

export async function getConvertPreReferralOptions(preReferralId: string) {
  try {
    await requirePermission("referrals.manage");

    const pre = await prisma.publicReferralRequest.findUnique({
      where: { id: preReferralId },
    });
    if (!pre) return { success: false as const, error: "Pré-encaminhamento não encontrado." };

    const docDigits = pre.companyDocument?.replace(/\D/g, "") ?? "";
    const company =
      (docDigits
        ? await prisma.company.findFirst({ where: { cnpj: docDigits } })
        : null) ??
      (await prisma.company.findFirst({
        where: { legalName: { contains: pre.companyName, mode: "insensitive" } },
      }));

    const patients = company
      ? await prisma.patient.findMany({
          where: { companyId: company.id },
          orderBy: { fullName: "asc" },
          take: 50,
          select: { id: true, fullName: true, cpf: true, jobTitle: true },
        })
      : [];

    const companies = await prisma.company.findMany({
      orderBy: { legalName: "asc" },
      take: 100,
      select: { id: true, legalName: true, tradeName: true, cnpj: true },
    });

    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { in: ["ADMIN", "RECEPCAO", "MEDICO", "TECNICO"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return {
      success: true as const,
      pre,
      companies,
      suggestedCompanyId: company?.id ?? null,
      patients,
      users,
    };
  } catch (error) {
    return { success: false as const, error: actionError(error, "Erro ao carregar opções.") };
  }
}
