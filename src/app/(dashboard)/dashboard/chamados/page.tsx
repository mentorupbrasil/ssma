import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { ChamadosClient } from "@/components/dashboard/tickets/ChamadosClient";

export const metadata = { title: "Chamados" };

export default async function ChamadosPage() {
  const session = await auth();
  const where = session?.user
    ? { ...scopedWhere({ user: session.user as never }), scope: "CLINIC" as const }
    : { scope: "CLINIC" as const };
  const items = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
  return <ChamadosClient items={items} />;
}
