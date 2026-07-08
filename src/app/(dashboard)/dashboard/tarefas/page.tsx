import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { TarefasClient } from "@/components/dashboard/tasks/TarefasClient";

export const metadata = { title: "Tarefas" };

export default async function TarefasPage() {
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const [items, users] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: { assignedTo: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "SUPER_ADMIN" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return <TarefasClient items={items} users={users} />;
}
