import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { AssistenteSstClient } from "@/components/dashboard/sst/AssistenteSstClient";

export const metadata = { title: "Assistente SST" };

export default async function AssistenteSstPage() {
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const companies = await prisma.company.findMany({
    where: { ...where, status: "ATIVA" },
    select: { id: true, tradeName: true, legalName: true },
    orderBy: { legalName: "asc" },
    take: 200,
  });

  return (
    <AssistenteSstClient
      companies={companies.map((c) => ({ id: c.id, label: c.tradeName ?? c.legalName }))}
    />
  );
}
