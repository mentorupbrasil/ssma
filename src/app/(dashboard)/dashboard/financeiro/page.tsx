import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { FinanceiroClient } from "@/components/dashboard/financial/FinanceiroClient";
import { formatCompetence } from "@/lib/closings";

export const metadata = { title: "Financeiro" };

export default async function FinanceiroPage() {
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [items, companies, aReceber, vencido, recebidoMes] = await Promise.all([
    prisma.financialEntry.findMany({
      where: { ...where, type: "RECEBER" },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        company: { select: { id: true, tradeName: true, legalName: true } },
        closing: { select: { id: true, referenceMonth: true, status: true } },
      },
    }),
    prisma.company.findMany({
      where: { ...where, status: "ATIVA" },
      select: { id: true, tradeName: true, legalName: true },
      orderBy: { legalName: "asc" },
      take: 400,
    }),
    prisma.financialEntry.aggregate({
      where: {
        ...where,
        type: "RECEBER",
        status: { notIn: ["PAGO", "CANCELADO"] },
      },
      _sum: { amount: true },
    }),
    prisma.financialEntry.aggregate({
      where: {
        ...where,
        type: "RECEBER",
        status: { in: ["PENDENTE", "ATRASADO", "PARCIAL", "AGUARDANDO_FATURAMENTO"] },
        dueDate: { lt: startOfToday },
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
  ]);

  return (
    <FinanceiroClient
      items={items.map((item) => ({
        id: item.id,
        source: item.source,
        description: item.description,
        amount: item.amount,
        dueDate: item.dueDate.toISOString(),
        createdAt: item.createdAt.toISOString(),
        status: item.status,
        paymentMethod: item.paymentMethod,
        invoiceNumber: item.invoiceNumber,
        category: item.category,
        referenceMonth: item.referenceMonth?.toISOString() ?? null,
        companyId: item.companyId,
        companyName: item.company?.tradeName ?? item.company?.legalName ?? "—",
        closingId: item.closingId,
        closingStatus: item.closing?.status ?? null,
        closingCompetence: item.closing?.referenceMonth
          ? formatCompetence(item.closing.referenceMonth)
          : item.referenceMonth
            ? formatCompetence(item.referenceMonth)
            : null,
        amountLocked: Boolean(
          item.closingId &&
            item.closing &&
            ["FECHADO", "FATURADO", "PAGO"].includes(item.closing.status)
        ),
      }))}
      companies={companies.map((c) => ({
        id: c.id,
        label: c.tradeName ?? c.legalName,
      }))}
      summary={{
        aReceber: aReceber._sum.amount ?? 0,
        vencido: vencido._sum.amount ?? 0,
        recebidoMes: recebidoMes._sum.amount ?? 0,
      }}
    />
  );
}
