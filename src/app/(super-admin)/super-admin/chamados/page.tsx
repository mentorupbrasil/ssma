import { prisma } from "@/lib/prisma";
import { ChamadosClient } from "@/components/dashboard/tickets/ChamadosClient";

export const metadata = { title: "Chamados SaaS" };

export default async function SuperAdminChamadosPage() {
  const items = await prisma.ticket.findMany({
    where: { scope: "SAAS" },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
  return <ChamadosClient items={items} saasMode />;
}
