import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { TabelaPrecosClient } from "@/components/dashboard/pricing/TabelaPrecosClient";
import { getPriceStats, listPriceItems } from "@/actions/pricing";

export const metadata = { title: "Tabela de preços" };

export default async function TabelaPrecosPage() {
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};

  const [items, stats, companies] = await Promise.all([
    listPriceItems(),
    getPriceStats(),
    prisma.company.findMany({
      where: { ...where, status: "ATIVA" },
      select: { id: true, tradeName: true, legalName: true },
      orderBy: { legalName: "asc" },
      take: 300,
    }),
  ]);

  return (
    <TabelaPrecosClient
      items={items}
      stats={stats}
      companies={companies.map((c) => ({
        id: c.id,
        label: c.tradeName ?? c.legalName,
      }))}
    />
  );
}
