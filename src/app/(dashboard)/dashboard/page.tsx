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
  Inbox,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { requireAuthSession } from "@/lib/page-auth";
import { getCompanyFilter, isEmpresaUser } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import { countPendingQuotes } from "@/actions/commercial";
import { countPendingDocuments } from "@/actions/documents";

export default async function DashboardPage() {
  const session = await requireAuthSession();
  const companyFilter = getCompanyFilter(session);
  const isEmpresa = isEmpresaUser(session);

  const canManageReferrals = hasPermission(session.user.role, "referrals.manage");
  const canManageCompanies = hasPermission(session.user.role, "companies.manage") && !isEmpresa;
  const canManagePatients = hasPermission(session.user.role, "patients.manage");
  const canManageAppointments = hasPermission(session.user.role, "appointments.manage");
  const canViewLeads = hasPermission(session.user.role, "leads.manage") && !isEmpresa;
  const canViewDocs = hasPermission(session.user.role, "documents.manage");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const canViewPreReferrals = canManageReferrals && !isEmpresa;

  const [
    newReferrals,
    inProgressReferrals,
    pendingPreReferrals,
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
    canViewPreReferrals
      ? prisma.publicReferralRequest.count({
          where: { status: { in: ["NOVO", "EM_ANALISE", "AGUARDANDO_RETORNO"] } },
        })
      : Promise.resolve(0),
    prisma.appointment.count({
      where: {
        ...companyFilter,
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { in: ["AGENDADO", "CONFIRMADO"] },
      },
    }),
    canManageCompanies
      ? prisma.company.count({ where: { status: "ATIVA" } })
      : isEmpresa
        ? Promise.resolve(1)
        : Promise.resolve(0),
    prisma.patient.count({ where: { ...companyFilter, status: "ATIVO" } }),
    canViewLeads
      ? countPendingQuotes()
      : Promise.resolve(0),
    canViewDocs
      ? countPendingDocuments(companyFilter.companyId)
      : Promise.resolve(0),
    prisma.referral.count({
      where: {
        ...companyFilter,
        status: "CONCLUIDO",
        updatedAt: { gte: monthStart },
      },
    }),
    prisma.referral.findMany({
      where: companyFilter,
      include: { company: true, patient: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: {
        ...companyFilter,
        scheduledAt: { gte: new Date() },
        status: { in: ["AGENDADO", "CONFIRMADO"] },
      },
      include: { patient: true, company: true },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
  ]);

  const stats = [
    { title: "Encaminhamentos novos", value: newReferrals, icon: FileText, show: true, href: "/dashboard/encaminhamentos?status=NOVO" },
    { title: "Em andamento", value: inProgressReferrals, icon: Clock, show: true, href: "/dashboard/encaminhamentos" },
    {
      title: "Pré-encaminhamentos",
      value: pendingPreReferrals,
      icon: Inbox,
      show: canViewPreReferrals,
      href: "/dashboard/pre-encaminhamentos?queue=active",
    },
    { title: "Agendados hoje", value: todayAppointments, icon: Calendar, show: canManageAppointments, href: "/dashboard/agenda?status=TODAY_AGENDADO" },
    {
      title: isEmpresa ? "Minha empresa" : "Empresas ativas",
      value: activeCompanies,
      icon: Building2,
      show: canManageCompanies || isEmpresa,
      href: isEmpresa ? undefined : "/dashboard/empresas",
    },
    { title: "Colaboradores", value: totalPatients, icon: Users, show: canManagePatients, href: "/dashboard/colaboradores" },
    { title: "Orçamentos pendentes", value: pendingLeads, icon: DollarSign, show: canViewLeads, href: "/dashboard/orcamentos" },
    { title: "Documentos pendentes", value: pendingDocs, icon: FolderOpen, show: canViewDocs, href: "/dashboard/documentos?card=PENDENTE" },
    { title: "Concluídos no mês", value: completedReferrals, icon: CheckCircle2, show: true, href: "/dashboard/encaminhamentos?status=CONCLUIDO" },
  ].filter((s) => s.show);

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description={
          isEmpresa
            ? "Acompanhe encaminhamentos e agendamentos da sua empresa"
            : "Indicadores e atividades recentes"
        }
      >
        {canManageReferrals && (
          <Link href="/dashboard/encaminhamentos/novo">
            <Button variant="brand" className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Novo encaminhamento
            </Button>
          </Link>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) =>
          stat.href ? (
            <Link key={stat.title} href={stat.href}>
              <StatCard title={stat.title} value={stat.value} icon={stat.icon} className="transition hover:border-[var(--brand-green)]/30" />
            </Link>
          ) : (
            <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
          )
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0F3D4A]">Últimos encaminhamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {recentReferrals.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum encaminhamento registrado.</p>
            ) : (
              <div className="space-y-3">
                {recentReferrals.map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/encaminhamentos/${r.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-sm">{r.protocol}</p>
                      <p className="text-xs text-slate-500">
                        {r.patient.fullName} — {r.company.tradeName ?? r.company.legalName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {CLINICAL_EXAM_LABELS[r.clinicalExamType]}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#0F3D4A]">Próximos agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum agendamento próximo.</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/dashboard/agenda?id=${a.id}`}
                    className="block rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                  >
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-slate-500">
                      {format(a.scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {a.patient && ` — ${a.patient.fullName}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {canManageCompanies && (
          <Link href="/dashboard/empresas/novo">
            <Button variant="outline" size="sm">
              Nova empresa
            </Button>
          </Link>
        )}
        {canManagePatients && (
          <Link href="/dashboard/colaboradores?new=1">
            <Button variant="outline" size="sm">
              Novo colaborador
            </Button>
          </Link>
        )}
        {canManageAppointments && (
          <Link href="/dashboard/agenda?new=1">
            <Button variant="outline" size="sm">
              Novo agendamento
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
