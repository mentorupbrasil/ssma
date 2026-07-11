"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { CompanyHistoryAction, CompanyStatus } from "@prisma/client";
import {
  requirePermission,
  assertCompanyAccess,
  actionError,
  isPrismaUniqueError,
} from "@/lib/authz";
import { resolveClinicId, withClinicId } from "@/lib/scoped-db";
import { createAuditLog } from "@/lib/server";
import {
  OPEN_REFERRAL_STATUSES,
  type CompanyDetailSerialized,
} from "@/lib/companies";
import { PENDING_QUOTE_STATUSES } from "@/lib/commercial";
import { maskCpf } from "@/lib/referrals";
import {
  createCompanySchema,
  updateCompanySchema,
  companyContactSchema,
  companyStatusSchema,
} from "@/schemas";

type ActionResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

async function recordCompanyHistory(
  companyId: string,
  action: CompanyHistoryAction,
  userId: string,
  notes?: string
) {
  await prisma.companyHistory.create({
    data: {
      companyId,
      action,
      notes: notes?.trim() || null,
      performedByUserId: userId,
    },
  });
}

export async function getCompanyDetail(
  id: string
): Promise<ActionResult<{ company: CompanyDetailSerialized }>> {
  try {
    const session = await requirePermission("companies.manage");
    await assertCompanyAccess(session, id);

    const now = new Date();
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        patients: {
          orderBy: { fullName: "asc" },
          include: {
            referrals: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
          },
        },
        referrals: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { patient: { select: { fullName: true } } },
        },
        appointments: {
          where: { scheduledAt: { gte: now }, status: { notIn: ["CANCELADO", "REAGENDADO", "FALTOU"] } },
          orderBy: { scheduledAt: "asc" },
          take: 30,
          include: { patient: { select: { fullName: true } } },
        },
        documents: { orderBy: { createdAt: "desc" }, take: 50 },
        leads: { orderBy: { createdAt: "desc" }, take: 30 },
        quotes: { orderBy: { createdAt: "desc" }, take: 30, include: { items: { select: { serviceName: true } } } },
        contacts: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { performedBy: { select: { name: true } } },
        },
        users: {
          where: { role: { in: ["COMPANY_HR", "EMPRESA"] } },
          select: { id: true, name: true, email: true, status: true, createdAt: true },
        },
        history: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { performedBy: { select: { name: true } } },
        },
      },
    });

    if (!company) return { success: false, error: "Empresa não encontrada." };

    const [
      openReferralsCount,
      upcomingAppointmentsCount,
      pendingDocsCount,
      pendingQuotesCount,
      lastAppointment,
      siteMessages,
    ] = await Promise.all([
      prisma.referral.count({
        where: { companyId: id, status: { in: OPEN_REFERRAL_STATUSES } },
      }),
      prisma.appointment.count({
        where: {
          companyId: id,
          scheduledAt: { gte: now },
          status: { in: ["AGENDADO", "CONFIRMADO", "EM_ATENDIMENTO"] },
        },
      }),
      prisma.document.count({
        where: {
          companyId: id,
          status: { in: ["PENDENTE", "EM_ELABORACAO", "VENCIDO"] },
        },
      }),
      prisma.quote.count({
        where: { companyId: id, status: { in: PENDING_QUOTE_STATUSES } },
      }),
      prisma.appointment.findFirst({
        where: { companyId: id, status: "CONCLUIDO" },
        orderBy: { scheduledAt: "desc" },
        select: { scheduledAt: true },
      }),
      prisma.contactMessage.findMany({
        where: { company: { contains: company.tradeName ?? company.legalName, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, name: true, subject: true, status: true, createdAt: true },
      }),
    ]);

    const allAppointments = await prisma.appointment.findMany({
      where: { companyId: id },
      orderBy: { scheduledAt: "desc" },
      take: 30,
      include: { patient: { select: { fullName: true } } },
    });

    const priceListItems = await prisma.priceListItem.findMany({
      where: { companyId: id, status: "ATIVA" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        defaultPrice: true,
        negotiatedPrice: true,
        chargeType: true,
        category: true,
      },
    });

    const serialized: CompanyDetailSerialized = {
      id: company.id,
      legalName: company.legalName,
      tradeName: company.tradeName,
      cnpj: company.cnpj,
      stateRegistration: company.stateRegistration,
      size: company.size,
      segment: company.segment,
      email: company.email,
      phone: company.phone,
      whatsapp: company.whatsapp,
      address: company.address,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
      responsibleName: company.responsibleName,
      responsibleRole: company.responsibleRole,
      contractType: company.contractType,
      portalEnabled: company.portalEnabled,
      status: company.status,
      notes: company.notes,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
      stats: {
        employees: company.patients.length,
        openReferrals: openReferralsCount,
        upcomingAppointments: upcomingAppointmentsCount,
        pendingDocuments: pendingDocsCount,
        pendingQuotes: pendingQuotesCount,
        lastAppointmentAt: lastAppointment?.scheduledAt.toISOString() ?? null,
      },
      employees: company.patients.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        cpf: maskCpf(p.cpf),
        jobTitle: p.jobTitle,
        department: p.department,
        status: p.status,
        lastReferralAt: p.referrals[0]?.createdAt.toISOString() ?? null,
      })),
      referrals: company.referrals.map((r) => ({
        id: r.id,
        protocol: r.protocol,
        employeeName: r.patient.fullName,
        clinicalExamType: r.clinicalExamType,
        createdAt: r.createdAt.toISOString(),
        scheduledAt: r.scheduledAt?.toISOString() ?? null,
        status: r.status,
      })),
      appointments: allAppointments.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt.toISOString(),
        employeeName: a.patient?.fullName ?? null,
        clinicalExamType: a.clinicalExamType,
        status: a.status,
        protocol: a.protocol,
      })),
      documents: company.documents.map((d) => ({
        id: d.id,
        title: d.title,
        type: d.type,
        status: d.status,
        validUntil: d.validUntil?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
        fileUrl: d.fileUrl,
      })),
      quotes: company.quotes.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        serviceTitle: q.items.map((i) => i.serviceName).join(", ") || q.companyName,
        estimatedValue: q.totalAmount,
        status: q.status,
        createdAt: q.createdAt.toISOString(),
        validUntil: q.validUntil?.toISOString() ?? null,
      })),
      contacts: company.contacts.map((c) => ({
        id: c.id,
        type: c.type,
        title: c.title,
        notes: c.notes,
        performedByName: c.performedBy?.name ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
      portalUsers: company.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
      })),
      history: company.history.map((h) => ({
        id: h.id,
        action: h.action,
        notes: h.notes,
        performedByName: h.performedBy?.name ?? null,
        createdAt: h.createdAt.toISOString(),
      })),
      siteMessages: siteMessages.map((m) => ({
        id: m.id,
        name: m.name,
        subject: m.subject,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
      })),
      priceListItems: priceListItems.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.negotiatedPrice ?? i.defaultPrice,
        chargeType: i.chargeType,
        category: i.category,
      })),
    };

    return { success: true, company: serialized };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao carregar empresa.") };
  }
}

export async function createCompanyFull(data: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createCompanySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  try {
    const session = await requirePermission("companies.manage");
    const clinicId = await resolveClinicId(session);
    const d = parsed.data;

    const existing = await prisma.company.findUnique({
      where: { cnpj: d.cnpj.replace(/\D/g, "") },
    });
    if (existing) {
      return { success: false, error: "Já existe uma empresa cadastrada com este CNPJ." };
    }

    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: withClinicId(
          {
          legalName: d.legalName.trim(),
          tradeName: d.tradeName?.trim() || null,
          cnpj: d.cnpj.replace(/\D/g, ""),
          stateRegistration: d.stateRegistration?.trim() || null,
          size: d.size,
          segment: d.segment?.trim() || null,
          email: d.email?.trim() || null,
          phone: d.phone?.trim() || null,
          whatsapp: d.whatsapp.replace(/\D/g, ""),
          address: d.address?.trim() || null,
          city: d.city?.trim() || null,
          state: d.state?.trim() || null,
          zipCode: d.zipCode?.replace(/\D/g, "") || null,
          responsibleName: d.responsibleName?.trim() || null,
          responsibleRole: d.responsibleRole?.trim() || null,
          contractType: d.contractType,
          portalEnabled: d.portalEnabled ?? false,
          status: d.status ?? "ATIVA",
          notes: d.notes?.trim() || null,
        },
        clinicId
        ),
      });

      await tx.companyHistory.create({
        data: {
          companyId: created.id,
          action: "CREATED",
          notes: "Empresa cadastrada",
          performedByUserId: session.user.id,
        },
      });

      return created;
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Company",
      entityId: company.id,
      details: company.legalName,
    });

    revalidatePath("/dashboard/empresas");
    return { success: true, id: company.id };
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return { success: false, error: "Já existe uma empresa cadastrada com este CNPJ." };
    }
    return { success: false, error: actionError(error, "Erro ao cadastrar empresa.") };
  }
}

export async function updateCompany(
  id: string,
  data: unknown
): Promise<ActionResult> {
  const parsed = updateCompanySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  try {
    const session = await requirePermission("companies.manage");
    await assertCompanyAccess(session, id);
    const d = parsed.data;

    if (d.cnpj) {
      const digits = d.cnpj.replace(/\D/g, "");
      const dup = await prisma.company.findFirst({
        where: { cnpj: digits, NOT: { id } },
      });
      if (dup) {
        return { success: false, error: "Já existe uma empresa cadastrada com este CNPJ." };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id },
        data: {
          ...(d.legalName !== undefined && { legalName: d.legalName.trim() }),
          ...(d.tradeName !== undefined && { tradeName: d.tradeName?.trim() || null }),
          ...(d.cnpj !== undefined && { cnpj: d.cnpj.replace(/\D/g, "") }),
          ...(d.stateRegistration !== undefined && {
            stateRegistration: d.stateRegistration?.trim() || null,
          }),
          ...(d.size !== undefined && { size: d.size }),
          ...(d.segment !== undefined && { segment: d.segment?.trim() || null }),
          ...(d.email !== undefined && { email: d.email?.trim() || null }),
          ...(d.phone !== undefined && { phone: d.phone?.trim() || null }),
          ...(d.whatsapp !== undefined && { whatsapp: d.whatsapp.replace(/\D/g, "") }),
          ...(d.address !== undefined && { address: d.address?.trim() || null }),
          ...(d.city !== undefined && { city: d.city?.trim() || null }),
          ...(d.state !== undefined && { state: d.state?.trim() || null }),
          ...(d.zipCode !== undefined && { zipCode: d.zipCode?.replace(/\D/g, "") || null }),
          ...(d.responsibleName !== undefined && {
            responsibleName: d.responsibleName?.trim() || null,
          }),
          ...(d.responsibleRole !== undefined && {
            responsibleRole: d.responsibleRole?.trim() || null,
          }),
          ...(d.contractType !== undefined && { contractType: d.contractType }),
          ...(d.portalEnabled !== undefined && { portalEnabled: d.portalEnabled }),
          ...(d.status !== undefined && { status: d.status }),
          ...(d.notes !== undefined && { notes: d.notes?.trim() || null }),
        },
      });

      await tx.companyHistory.create({
        data: {
          companyId: id,
          action: "UPDATED",
          notes: "Dados da empresa atualizados",
          performedByUserId: session.user.id,
        },
      });
    });

    revalidatePath("/dashboard/empresas");
    revalidatePath(`/dashboard/empresas/${id}`);
    return { success: true };
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return { success: false, error: "Já existe uma empresa cadastrada com este CNPJ." };
    }
    return { success: false, error: actionError(error, "Erro ao atualizar empresa.") };
  }
}

export async function updateCompanyStatus(
  id: string,
  status: string,
  notes?: string
): Promise<ActionResult> {
  const parsed = companyStatusSchema.safeParse(status);
  if (!parsed.success) return { success: false, error: "Status inválido." };

  try {
    const session = await requirePermission("companies.manage");
    await assertCompanyAccess(session, id);

    await prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id },
        data: { status: parsed.data },
      });
      await tx.companyHistory.create({
        data: {
          companyId: id,
          action: "STATUS_CHANGED",
          notes: notes ?? `Status alterado para ${parsed.data}`,
          performedByUserId: session.user.id,
        },
      });
    });

    revalidatePath("/dashboard/empresas");
    revalidatePath(`/dashboard/empresas/${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao alterar status.") };
  }
}

export async function toggleCompanyPortal(
  id: string,
  enabled: boolean
): Promise<ActionResult> {
  try {
    const session = await requirePermission("companies.manage");
    await assertCompanyAccess(session, id);

    await prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id },
        data: { portalEnabled: enabled },
      });
      await tx.companyHistory.create({
        data: {
          companyId: id,
          action: enabled ? "PORTAL_ENABLED" : "PORTAL_DISABLED",
          notes: enabled ? "Portal empresarial ativado" : "Portal empresarial desativado",
          performedByUserId: session.user.id,
        },
      });
    });

    revalidatePath(`/dashboard/empresas/${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao atualizar portal.") };
  }
}

export async function addCompanyContact(
  companyId: string,
  data: unknown
): Promise<ActionResult> {
  const parsed = companyContactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados do contato inválidos." };
  }

  try {
    const session = await requirePermission("companies.manage");
    await assertCompanyAccess(session, companyId);

    await prisma.$transaction(async (tx) => {
      await tx.companyContact.create({
        data: {
          companyId,
          type: parsed.data.type,
          title: parsed.data.title?.trim() || null,
          notes: parsed.data.notes.trim(),
          performedByUserId: session.user.id,
        },
      });
      await tx.companyHistory.create({
        data: {
          companyId,
          action: "CONTACT_ADDED",
          notes: parsed.data.notes.trim(),
          performedByUserId: session.user.id,
        },
      });
    });

    revalidatePath(`/dashboard/empresas/${companyId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao registrar contato.") };
  }
}

export async function attachCompanyDocument(
  companyId: string,
  data: { title: string; type: string; fileUrl?: string; validUntil?: string; notes?: string }
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("documents.manage");
    await assertCompanyAccess(session, companyId);

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          title: data.title.trim(),
          type: data.type as "ASO" | "PCMSO" | "PGR" | "LTCAT" | "PPP" | "LAUDO" | "CONTRATO" | "PROPOSTA" | "OUTRO",
          status: "PENDENTE",
          fileUrl: data.fileUrl?.trim() || null,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          notes: data.notes?.trim() || null,
          companyId,
        },
      });

      await tx.companyHistory.create({
        data: {
          companyId,
          action: "DOCUMENT_ATTACHED",
          notes: `Documento: ${data.title}`,
          performedByUserId: session.user.id,
        },
      });

      return created;
    });

    revalidatePath(`/dashboard/empresas/${companyId}`);
    return { success: true, id: doc.id };
  } catch (error) {
    return { success: false, error: actionError(error, "Erro ao anexar documento.") };
  }
}

export async function getCompanyCities(): Promise<string[]> {
  try {
    await requirePermission("companies.manage");
    const rows = await prisma.company.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
      take: 100,
    });
    return rows.map((r) => r.city!).filter(Boolean);
  } catch {
    return [];
  }
}
