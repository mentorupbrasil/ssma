import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthSession } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { Building2, AlertTriangle, FileText, DollarSign } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);
  const overview = await getDashboardOverview(session);

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description={
          isEmpresa
            ? "Portal empresarial — documentos, encaminhamentos e solicitações da sua empresa"
            : "Pendências operacionais, comercial e documental da clínica"
        }
      />

      <div className="mb-6 rounded-xl border border-[var(--brand-green)]/20 bg-[var(--brand-green-light)]/40 px-4 py-3 text-sm text-slate-700">
        <strong>Plataforma complementar:</strong> este sistema organiza portal empresarial, documentos,
        fechamentos e operações — não substitui o sistema clínico de atendimento da clínica.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {overview.stats.map((stat) => (
          <Link key={stat.key} href={stat.href}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={Building2}
              className="transition hover:border-[var(--brand-green)]/30"
            />
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0F3D4A]">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Pendências que precisam de ação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview.pendingActions.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma pendência urgente no momento.</p>
            ) : (
              <div className="space-y-3">
                {overview.pendingActions.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    className="block rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.subtitle}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!isEmpresa && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F3D4A]">
                <FileText className="h-5 w-5 text-[var(--brand-green)]" />
                Últimos pré-encaminhamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview.recentPreReferrals.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum pré-encaminhamento recente.</p>
              ) : (
                <div className="space-y-3">
                  {overview.recentPreReferrals.map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/pre-encaminhamentos/${p.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.protocol}</p>
                        <p className="text-xs text-slate-500">
                          {p.employeeName} — {p.companyName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {format(p.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <StatusBadge status={p.status} type="preReferral" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-[#0F3D4A]">Documentos aguardando upload</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.pendingDocuments.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum documento pendente.</p>
            ) : (
              <div className="space-y-3">
                {overview.pendingDocuments.map((d) => (
                  <Link
                    key={d.id}
                    href="/dashboard/documentos?card=PENDENTE"
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-slate-500">{d.companyName ?? "—"}</p>
                    </div>
                    <StatusBadge status={d.status} type="document" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!isEmpresa && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F3D4A]">
                <DollarSign className="h-5 w-5 text-[var(--brand-green)]" />
                Orçamentos em negociação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview.negotiatingQuotes.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum orçamento em negociação.</p>
              ) : (
                <div className="space-y-3">
                  {overview.negotiatingQuotes.map((q) => (
                    <Link
                      key={q.id}
                      href={`/dashboard/orcamentos?tab=orcamentos`}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium">{q.quoteNumber}</p>
                        <p className="text-xs text-slate-500">{q.companyName}</p>
                      </div>
                      <StatusBadge status={q.status} type="quote" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/documentos?new=1">
          <Button variant="brand" size="sm">
            Novo documento
          </Button>
        </Link>
        {!isEmpresa && (
          <Link href="/dashboard/pre-encaminhamentos">
            <Button variant="outline" size="sm">
              Ver pré-encaminhamentos
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
