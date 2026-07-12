"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { scopedWhere } from "@/lib/scoped-db";
import { filterEnabledHrefItems } from "@/lib/modules";

export type SearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const session = await requireSession();
  const q = query.trim();
  if (q.length < 2) return [];

  const where = scopedWhere(session);
  const contains = { contains: q, mode: "insensitive" as const };

  const [companies, patients, referrals, documents] = await Promise.all([
    prisma.company.findMany({
      where: { ...where, OR: [{ legalName: contains }, { tradeName: contains }, { cnpj: contains }] },
      take: 5,
      select: { id: true, tradeName: true, legalName: true },
    }),
    prisma.patient.findMany({
      where: { ...where, OR: [{ fullName: contains }, { cpf: contains }] },
      take: 5,
      select: { id: true, fullName: true, cpf: true },
    }),
    prisma.referral.findMany({
      where: { ...where, OR: [{ protocol: contains }] },
      take: 5,
      select: { id: true, protocol: true, patient: { select: { fullName: true } } },
    }),
    prisma.document.findMany({
      where: { ...where, title: contains },
      take: 5,
      select: { id: true, title: true },
    }),
  ]);

  return filterEnabledHrefItems([
    ...companies.map((c) => ({
      type: "Empresa",
      id: c.id,
      title: c.tradeName ?? c.legalName,
      subtitle: c.legalName,
      href: `/dashboard/empresas/${c.id}`,
    })),
    ...patients.map((p) => ({
      type: "Colaborador",
      id: p.id,
      title: p.fullName,
      subtitle: p.cpf,
      href: `/dashboard/colaboradores/${p.id}`,
    })),
    ...referrals.map((r) => ({
      type: "Encaminhamento",
      id: r.id,
      title: r.protocol,
      subtitle: r.patient.fullName,
      href: `/dashboard/encaminhamentos/${r.id}`,
    })),
    ...documents.map((d) => ({
      type: "Documento",
      id: d.id,
      title: d.title,
      subtitle: "Documento",
      href: `/dashboard/documentos`,
    })),
  ]);
}
