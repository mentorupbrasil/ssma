import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";

export default async function AgendaPage() {
  const session = await auth();
  const where = session?.user?.role === "EMPRESA" && session.user.companyId
    ? { companyId: session.user.companyId }
    : {};

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

  return (
    <div>
      <PageHeader title="Agenda" description="Agendamentos de atendimentos e exames" />

      {Object.keys(grouped).length === 0 ? (
        <p className="text-slate-500">Nenhum agendamento encontrado.</p>
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
                          {a.company && <p className="text-xs text-slate-400">{a.company.tradeName}</p>}
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
