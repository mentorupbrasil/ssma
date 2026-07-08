import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { FinanceiroClient } from "@/components/dashboard/financial/FinanceiroClient";

export const metadata = { title: "Financeiro" };

export default async function FinanceiroPage() {
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const items = await prisma.financialEntry.findMany({
    where,
    orderBy: { dueDate: "asc" },
    include: { company: { select: { tradeName: true, legalName: true } } },
  });
  return <FinanceiroClient items={items} />;
}
