import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { InlineEmptyNote } from "@/components/dashboard/InlineEmptyNote";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/button";
import { requireAuthSession } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { Building2, AlertTriangle, FileText, DollarSign } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);
  const overview = await getDashboardOverview(session);

  return (
    <div className="dashboard-overview">
      <PageHeader
        title="Visão geral"
        description={
          isEmpresa
            ? "Portal empresarial — documentos, encaminhamentos e solicitações da sua empresa"
            : "Pendências operacionais, comercial e documental da clínica"
        }
      >
        <Link href="/dashboard/documentos?new=1">
          <Button variant="brand" size="sm">
            Novo documento
          </Button>
        </Link>
        {!isEmpresa && (
          <Link href="/dashboard/pre-encaminhamentos">
            <Button variant="outline" size="sm">
              Pré-encaminhamentos
            </Button>
          </Link>
        )}
      </PageHeader>

      <div className="dashboard-callout">
        <strong>Plataforma complementar:</strong> este sistema organiza portal empresarial, documentos,
        fechamentos e operações — não substitui o sistema clínico de atendimento da clínica.
      </div>

      <div className="dashboard-stats-grid">
        {overview.stats.map((stat) => (
          <Link key={stat.key} href={stat.href} className="block h-full">
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={Building2}
              className="h-full transition hover:border-[var(--brand-green)]/35 hover:shadow-md"
            />
          </Link>
        ))}
      </div>

      <div className="dashboard-panels-grid">
        <DashboardPanel title="Pendências que precisam de ação" icon={AlertTriangle}>
          {overview.pendingActions.length === 0 ? (
            <InlineEmptyNote>Nenhuma pendência urgente no momento.</InlineEmptyNote>
          ) : (
            <div className="dashboard-list">
              {overview.pendingActions.map((item) => (
                <Link key={`${item.type}-${item.id}`} href={item.href} className="dashboard-list-item">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.subtitle}</p>
                </Link>
              ))}
            </div>
          )}
        </DashboardPanel>

        {!isEmpresa && (
          <DashboardPanel title="Últimos pré-encaminhamentos" icon={FileText}>
            {overview.recentPreReferrals.length === 0 ? (
              <InlineEmptyNote>Nenhum pré-encaminhamento recente.</InlineEmptyNote>
            ) : (
              <div className="dashboard-list">
                {overview.recentPreReferrals.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/pre-encaminhamentos/${p.id}`}
                    className="dashboard-list-item dashboard-list-item-row"
                  >
                    <div className="min-w-0">
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
          </DashboardPanel>
        )}

        <DashboardPanel title="Documentos aguardando upload" icon={FileText}>
          {overview.pendingDocuments.length === 0 ? (
            <InlineEmptyNote>Nenhum documento pendente.</InlineEmptyNote>
          ) : (
            <div className="dashboard-list">
              {overview.pendingDocuments.map((d) => (
                <Link
                  key={d.id}
                  href="/dashboard/documentos?card=PENDENTE"
                  className="dashboard-list-item dashboard-list-item-row"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-slate-500">{d.companyName ?? "—"}</p>
                  </div>
                  <StatusBadge status={d.status} type="document" />
                </Link>
              ))}
            </div>
          )}
        </DashboardPanel>

        {!isEmpresa && (
          <DashboardPanel title="Orçamentos em negociação" icon={DollarSign}>
            {overview.negotiatingQuotes.length === 0 ? (
              <InlineEmptyNote>Nenhum orçamento em negociação.</InlineEmptyNote>
            ) : (
              <div className="dashboard-list">
                {overview.negotiatingQuotes.map((q) => (
                  <Link
                    key={q.id}
                    href="/dashboard/orcamentos?tab=orcamentos"
                    className="dashboard-list-item dashboard-list-item-row"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{q.quoteNumber}</p>
                      <p className="text-xs text-slate-500">{q.companyName}</p>
                    </div>
                    <StatusBadge status={q.status} type="quote" />
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>
        )}
      </div>
    </div>
  );
}
