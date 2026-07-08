import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Building2, LifeBuoy, Users } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Super Admin" };

export default async function SuperAdminPage() {
  const session = await auth();
  if (!session?.user || normalizeRole(session.user.role) !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const [clinics, clinicCount, userCount, activeClinics, openTickets] = await Promise.all([
    prisma.clinic.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: { select: { companies: true, users: true, documents: true } },
      },
    }),
    prisma.clinic.count(),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    prisma.clinic.count({ where: { status: "ATIVA" } }),
    prisma.ticket.count({
      where: { scope: "SAAS", status: { in: ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Super Admin"
        description="Gestão de clínicas, planos e suporte do SaaS Unimetra"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Clínicas" value={clinicCount} icon={Building2} />
        <StatCard title="Clínicas ativas" value={activeClinics} icon={Building2} />
        <StatCard title="Usuários" value={userCount} icon={Users} />
        <StatCard title="Chamados abertos" value={openTickets} icon={LifeBuoy} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Clínicas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma clínica cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {clinics.map((c) => (
                <Link
                  key={c.id}
                  href={`/super-admin/clinicas`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-4 transition hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c._count.companies} empresas · {c._count.users} usuários ·{" "}
                      {c._count.documents} documentos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{c.plan}</span>
                    <StatusBadge status={c.status} type="company" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
