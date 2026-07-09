import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { FinanceiroClient } from "@/components/dashboard/financial/FinanceiroClient";

export const metadata = { title: "Financeiro" };

export default async function FinanceiroPage() {
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [items, receivableMonth, received, overdue, awaitingInvoice, pendingCompanies] = await Promise.all([
    prisma.financialEntry.findMany({
      where: { ...where, type: "RECEBER" },
      orderBy: { dueDate: "asc" },
      include: {
        company: { select: { tradeName: true, legalName: true } },
        closing: { select: { id: true, referenceMonth: true } },
      },
    }),
    prisma.financialEntry.aggregate({
      where: {
        ...where,
        type: "RECEBER",
        dueDate: { gte: monthStart, lte: monthEnd },
        status: { notIn: ["PAGO", "CANCELADO"] },
      },
      _sum: { amount: true },
    }),
    prisma.financialEntry.aggregate({
      where: {
        ...where,
        type: "RECEBER",
        status: "PAGO",
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.financialEntry.aggregate({
      where: {
        ...where,
        type: "RECEBER",
        status: { in: ["PENDENTE", "ATRASADO", "PARCIAL"] },
        dueDate: { lt: now },
      },
      _sum: { amount: true },
    }),
    prisma.financialEntry.count({
      where: { ...where, type: "RECEBER", status: "AGUARDANDO_FATURAMENTO" },
    }),
    prisma.financialEntry.groupBy({
      by: ["companyId"],
      where: {
        ...where,
        type: "RECEBER",
        status: { notIn: ["PAGO", "CANCELADO"] },
        companyId: { not: null },
      },
    }).then((rows) => rows.length),
  ]);

  return (
    <FinanceiroClient
      items={items}
      summary={{
        receivableMonth: receivableMonth._sum.amount ?? 0,
        received: received._sum.amount ?? 0,
        overdue: overdue._sum.amount ?? 0,
        awaitingInvoice,
        pendingCompanies,
      }}
    />
  );
}
