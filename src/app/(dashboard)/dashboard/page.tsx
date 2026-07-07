import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Clock,
  Calendar,
  Building2,
  Users,
  DollarSign,
  FolderOpen,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINICAL_EXAM_LABELS } from "@/types";

export default async function DashboardPage() {
  const session = await auth();
  const companyFilter = session?.user?.role === "EMPRESA" && session.user.companyId
    ? { companyId: session.user.companyId }
    : {};

  const [
    newReferrals,
    inProgressReferrals,
    todayAppointments,
    activeCompanies,
    totalPatients,
    pendingLeads,
    pendingDocs,
    completedReferrals,
    recentReferrals,
    upcomingAppointments,
  ] = await Promise.all([
    prisma.referral.count({ where: { ...companyFilter, status: "NOVO" } }),
    prisma.referral.count({
      where: {
        ...companyFilter,
        status: { in: ["EM_ANALISE", "AGUARDANDO_AGENDAMENTO", "AGENDADO", "EM_ATENDIMENTO"] },
      },
    }),
    prisma.appointment.count({
      where: {
        ...companyFilter,
        scheduledAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.patient.count({ where: { ...companyFilter, status: "ACTIVE" } }),
    prisma.lead.count({ where: { status: { in: ["NOVO", "EM_CONTATO"] } } }),
    prisma.document.count({ where: { status: "PENDENTE" } }),
    prisma.referral.count({
      where: {
        ...companyFilter,
        status: "CONCLUIDO",
        updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.referral.findMany({
      where: companyFilter,
      include: { company: true, patient: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: { ...companyFilter, scheduledAt: { gte: new Date() }, status: { in: ["AGENDADO", "CONFIRMADO"] } },
      include: { patient: true, company: true },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Visão geral" description="Indicadores e atividades recentes">
        <Link href="/dashboard/encaminhamentos/novo">
          <Button variant="brand" className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Novo encaminhamento
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Encaminhamentos novos" value={newReferrals} icon={FileText} />
        <StatCard title="Em andamento" value={inProgressReferrals} icon={Clock} />
        <StatCard title="Agendados hoje" value={todayAppointments} icon={Calendar} />
        <StatCard title="Empresas ativas" value={activeCompanies} icon={Building2} />
        <StatCard title="Pacientes" value={totalPatients} icon={Users} />
        <StatCard title="Orçamentos pendentes" value={pendingLeads} icon={DollarSign} />
        <StatCard title="Documentos pendentes" value={pendingDocs} icon={FolderOpen} />
        <StatCard title="Concluídos no mês" value={completedReferrals} icon={CheckCircle2} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0F3D4A]">Últimos encaminhamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReferrals.map((r) => (
                <Link
                  key={r.id}
                  href={`/dashboard/encaminhamentos/${r.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-sm">{r.protocol}</p>
                    <p className="text-xs text-slate-500">{r.patient.fullName} — {r.company.tradeName ?? r.company.legalName}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#0F3D4A]">Próximos agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum agendamento próximo.</p>
              ) : (
                upcomingAppointments.map((a) => (
                  <div key={a.id} className="rounded-lg border border-slate-100 p-3">
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-slate-500">
                      {format(a.scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {a.patient && ` — ${a.patient.fullName}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/empresas/novo"><Button variant="outline" size="sm">Nova empresa</Button></Link>
        <Link href="/dashboard/pacientes/novo"><Button variant="outline" size="sm">Novo paciente</Button></Link>
        <Link href="/dashboard/agenda"><Button variant="outline" size="sm">Novo agendamento</Button></Link>
      </div>
    </div>
  );
}
