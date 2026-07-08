import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { FechamentoClient } from "@/components/dashboard/closings/FechamentoClient";

export const metadata = { title: "Fechamento mensal" };

export default async function FechamentoMensalPage() {
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const items = await prisma.monthlyClosing.findMany({
    where,
    orderBy: { referenceMonth: "desc" },
    include: { company: { select: { tradeName: true, legalName: true } } },
  });
  return <FechamentoClient items={items} />;
}
