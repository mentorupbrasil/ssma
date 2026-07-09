import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { requirePagePermission } from "@/lib/page-auth";
import { UsuariosClient } from "@/components/dashboard/users/UsuariosClient";

export const metadata = { title: "Usuários" };

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string; q?: string; status?: string }>;
}) {
  await requirePagePermission("users.manage");
  const params = await searchParams;
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const [users, companies] = await Promise.all([
    prisma.user.findMany({
      where: { ...where, role: { not: "SUPER_ADMIN" } },
      include: { company: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      where,
      select: { id: true, tradeName: true, legalName: true },
      orderBy: { legalName: "asc" },
    }),
  ]);
  return (
    <UsuariosClient
      users={users}
      companies={companies.map((c) => ({ id: c.id, name: c.tradeName ?? c.legalName }))}
      defaultCompanyId={params.companyId}
    />
  );
}
