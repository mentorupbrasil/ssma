import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { requirePagePermission } from "@/lib/page-auth";
import { getRolePermissionsMatrix } from "@/actions/users";
import { UsuariosClient } from "@/components/dashboard/users/UsuariosClient";

export const metadata = { title: "Usuários e permissões" };

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{
    companyId?: string;
    q?: string;
    status?: string;
    role?: string;
    tab?: string;
    page?: string;
  }>;
}) {
  await requirePagePermission("users.manage");
  const params = await searchParams;
  const session = await auth();
  const where = session?.user ? scopedWhere({ user: session.user as never }) : {};

  const [users, companies, rolePermissions] = await Promise.all([
    prisma.user.findMany({
      where: { ...where, role: { not: "SUPER_ADMIN" } },
      include: {
        company: { select: { tradeName: true, legalName: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      where: { ...where, status: "ATIVA" },
      select: { id: true, tradeName: true, legalName: true },
      orderBy: { legalName: "asc" },
    }),
    getRolePermissionsMatrix(),
  ]);

  return (
    <UsuariosClient
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        lastAccessAt: u.lastAccessAt?.toISOString() ?? null,
        updatedAt: u.updatedAt.toISOString(),
        companyId: u.companyId,
        company: u.company,
      }))}
      companies={companies.map((c) => ({
        id: c.id,
        name: c.tradeName ?? c.legalName,
      }))}
      rolePermissions={rolePermissions}
      defaultCompanyId={params.companyId}
      filters={{
        tab: params.tab,
        q: params.q,
        role: params.role,
        status: params.status,
        companyId: params.companyId,
        page: params.page,
      }}
    />
  );
}
