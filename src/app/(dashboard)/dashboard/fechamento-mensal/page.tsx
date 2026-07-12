import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { FechamentoClient } from "@/components/dashboard/closings/FechamentoClient";
import { formatCompetence } from "@/lib/closings";

export const metadata = { title: "Fechamento mensal" };

export default async function FechamentoMensalPage() {
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};

  const [items, companies] = await Promise.all([
    prisma.monthlyClosing.findMany({
      where: {
        ...where,
        companyId: { not: null },
      },
      orderBy: [{ referenceMonth: "desc" }, { createdAt: "desc" }],
      include: {
        company: { select: { id: true, tradeName: true, legalName: true } },
        entries: {
          where: { type: "RECEBER", source: "FECHAMENTO" },
          select: { id: true },
          take: 1,
        },
        lineItems: {
          select: { notes: true },
        },
      },
    }),
    prisma.company.findMany({
      where: { ...where, status: "ATIVA" },
      select: { id: true, tradeName: true, legalName: true },
      orderBy: { legalName: "asc" },
      take: 400,
    }),
  ]);

  const serialized = items.map((item) => {
    const situations = item.lineItems.map((li) =>
      li.notes?.startsWith("SIT:") ? li.notes.slice(4) : "OK"
    );
    const duplicateCount = situations.filter((s) => s === "DUPLICADO").length;
    return {
      id: item.id,
      referenceMonth: item.referenceMonth.toISOString(),
      competenceLabel: formatCompetence(item.referenceMonth),
      status: item.status,
      totalAmount: item.totalAmount,
      importedCount: item.importedCount,
      withoutPriceCount: item.withoutPriceCount,
      divergenceCount: item.divergenceCount + duplicateCount,
      companyId: item.companyId!,
      companyName: item.company?.tradeName ?? item.company?.legalName ?? "—",
      hasFinancialEntry: item.entries.length > 0,
    };
  });

  return (
    <FechamentoClient
      items={serialized}
      companies={companies.map((c) => ({
        id: c.id,
        label: c.tradeName ?? c.legalName,
      }))}
    />
  );
}
