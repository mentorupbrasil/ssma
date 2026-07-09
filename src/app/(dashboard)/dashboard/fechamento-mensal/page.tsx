import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { FechamentoClient } from "@/components/dashboard/closings/FechamentoClient";

export const metadata = { title: "Fechamento mensal" };

export default async function FechamentoMensalPage() {
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [items, imports, openClosings, monthImports, importAgg, previewAgg] = await Promise.all([
    prisma.monthlyClosing.findMany({
      where,
      orderBy: { referenceMonth: "desc" },
      include: { company: { select: { tradeName: true, legalName: true } } },
    }),
    prisma.productionImport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.monthlyClosing.count({
      where: { ...where, status: { in: ["RASCUNHO", "EM_REVISAO", "EM_CONFERENCIA", "COM_DIVERGENCIA"] } },
    }),
    prisma.productionImport.count({
      where: { ...where, createdAt: { gte: monthStart } },
    }),
    prisma.productionImport.aggregate({
      where,
      _sum: { withoutPrice: true, divergences: true },
    }),
    prisma.monthlyClosing.aggregate({
      where: { ...where, status: { notIn: ["CANCELADO"] } },
      _sum: { totalAmount: true },
    }),
  ]);

  return (
    <FechamentoClient
      items={items}
      imports={imports}
      summary={{
        openClosings,
        monthImports,
        withoutPrice: importAgg._sum.withoutPrice ?? 0,
        divergences: importAgg._sum.divergences ?? 0,
        totalPreview: previewAgg._sum.totalAmount ?? 0,
      }}
    />
  );
}
