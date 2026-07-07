import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuthSession } from "@/lib/page-auth";
import { getCompanyFilter } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";

export default async function AgendaPage() {
  const session = await requireAuthSession();
  const where = getCompanyFilter(session);

  const appointments = await prisma.appointment.findMany({
    where,
    include: { patient: true, company: true, referral: true },
    orderBy: { scheduledAt: "asc" },
  });

  const grouped = appointments.reduce<Record<string, typeof appointments>>((acc, apt) => {
    const key = format(apt.scheduledAt, "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {});

  const canCreate = hasPermission(session.user.role, "appointments.manage");

  return (
    <div>
      <PageHeader title="Agenda" description="Agendamentos de atendimentos e exames">
        {canCreate && (
          <Link href="/dashboard/agenda/novo">
            <Button variant="brand">
              <Plus className="mr-2 h-4 w-4" /> Novo agendamento
            </Button>
          </Link>
        )}
      </PageHeader>

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-500">
            Nenhum agendamento encontrado.
            {canCreate && (
              <p className="mt-2">
                <Link href="/dashboard/agenda/novo" className="text-[var(--brand-green)] underline">
                  Criar primeiro agendamento
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="mb-3 font-semibold text-[#0F3D4A]">
                {format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{a.title}</p>
                          <p className="text-sm text-slate-500">{format(a.scheduledAt, "HH:mm")}</p>
                          {a.patient && <p className="mt-1 text-sm">{a.patient.fullName}</p>}
                          {a.company && (
                            <p className="text-xs text-slate-400">{a.company.tradeName}</p>
                          )}
                          {a.referral && (
                            <p className="text-xs text-slate-400">Ref: {a.referral.protocol}</p>
                          )}
                        </div>
                        <StatusBadge status={a.status} type="appointment" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
