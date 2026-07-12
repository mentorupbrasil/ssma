import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { TabelaPrecosClient } from "@/components/dashboard/pricing/TabelaPrecosClient";
import { listPriceCatalog } from "@/actions/pricing";

export const metadata = { title: "Tabela de preços" };

export default async function TabelaPrecosPage() {
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};

  const [catalog, companies] = await Promise.all([
    listPriceCatalog(),
    prisma.company.findMany({
      where: { ...where, status: "ATIVA" },
      select: { id: true, tradeName: true, legalName: true },
      orderBy: { legalName: "asc" },
      take: 300,
    }),
  ]);

  return (
    <TabelaPrecosClient
      defaults={catalog.defaults}
      companyItems={catalog.companyItems}
      companies={companies.map((c) => ({
        id: c.id,
        label: c.tradeName ?? c.legalName,
      }))}
    />
  );
}
