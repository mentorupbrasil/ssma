import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  AlertTriangle,
  FileText,
  DollarSign,
  Upload,
  ClipboardList,
  FolderOpen,
  Inbox,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageShell } from "@/components/dashboard/PageShell";
import { PlatformPositioningBanner } from "@/components/dashboard/PlatformPositioningBanner";
import { QuickActionGrid } from "@/components/dashboard/QuickActionGrid";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { InlineEmptyNote } from "@/components/dashboard/InlineEmptyNote";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { requireAuthSession } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { getMetricMeta } from "@/lib/metric-cards";

export default async function DashboardPage() {
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);
  const overview = await getDashboardOverview(session);

  const quickActions = isEmpresa
    ? [
        { href: "/dashboard/encaminhamentos/novo", label: "Novo encaminhamento", description: "Solicitar exame ocupacional", icon: FileText },
        { href: "/dashboard/documentos", label: "Ver documentos", description: "ASOs e laudos da empresa", icon: FolderOpen },
        { href: "/dashboard/chamados", label: "Abrir chamado", description: "Falar com a clínica", icon: Inbox },
      ]
    : [
        { href: "/dashboard/empresas/novo", label: "Nova empresa", description: "Cadastrar cliente corporativo", icon: Building2 },
        { href: "/dashboard/encaminhamentos/novo", label: "Novo encaminhamento", description: "Registrar encaminhamento oficial", icon: FileText },
        { href: "/dashboard/documentos?new=1", label: "Anexar documento", description: "ASO, laudo ou proposta", icon: FolderOpen },
        { href: "/dashboard/fechamento-mensal", label: "Importar produção", description: "Fechamento mensal da clínica", icon: Upload },
        { href: "/dashboard/orcamentos?tab=orcamentos", label: "Novo orçamento", description: "Proposta comercial", icon: DollarSign },
        { href: "/dashboard/tarefas", label: "Nova tarefa", description: "Pendência interna", icon: ClipboardList },
      ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={isEmpresa ? "Portal empresarial" : "Cockpit operacional"}
        title="Visão geral"
        description={
          isEmpresa
            ? "Documentos, encaminhamentos e solicitações da sua empresa em um só lugar."
            : "Pendências, produção e ações prioritárias da clínica — atualizado em tempo real."
        }
      />

      <PlatformPositioningBanner />

      <section>
        <h2 className="section-label">Atalhos rápidos</h2>
        <QuickActionGrid actions={quickActions} />
      </section>

      <section>
        <h2 className="section-label">Indicadores</h2>
        <MetricGrid>
          {overview.stats
            .filter((stat) => stat.show)
            .map((stat) => {
              const meta = getMetricMeta(`overview:${stat.key}`);
              return (
                <Link key={stat.key} href={stat.href} className="block h-full">
                  <MetricCard
                    label={stat.title}
                    value={stat.value}
                    icon={meta.icon}
                    description={meta.description}
                    variant={meta.tone}
                    badge={meta.badge}
                    className="h-full"
                  />
                </Link>
              );
            })}
        </MetricGrid>
      </section>

      <div className="dashboard-panels-grid">
        <DashboardPanel title="Precisa de ação agora" icon={AlertTriangle}>
          {overview.pendingActions.length === 0 ? (
            <InlineEmptyNote>Nenhuma pendência crítica no momento. Operação em dia.</InlineEmptyNote>
          ) : (
            <div className="dashboard-list">
              {overview.pendingActions.map((item) => (
                <Link key={`${item.type}-${item.id}`} href={item.href} className="dashboard-list-item">
                  <p className="text-sm font-semibold text-[var(--brand-navy)]">{item.title}</p>
                  <p className="text-xs text-[var(--dash-text-muted)]">{item.subtitle}</p>
                </Link>
              ))}
            </div>
          )}
        </DashboardPanel>

        {!isEmpresa && (
          <DashboardPanel title="Atividades recentes" description="Pré-encaminhamentos recebidos" icon={FileText}>
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
                      <p className="text-sm font-semibold text-[var(--brand-navy)]">{p.protocol}</p>
                      <p className="text-xs text-[var(--dash-text-muted)]">
                        {p.employeeName} — {p.companyName}
                      </p>
                      <p className="text-xs text-[var(--dash-text-subtle)]">
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

        <DashboardPanel title="Documentos pendentes" icon={FolderOpen}>
          {overview.pendingDocuments.length === 0 ? (
            <InlineEmptyNote>Nenhum documento pendente.</InlineEmptyNote>
          ) : (
            <div className="dashboard-list">
              {overview.pendingDocuments.map((d) => (
                <Link key={d.id} href="/dashboard/documentos" className="dashboard-list-item dashboard-list-item-row">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--brand-navy)]">{d.title}</p>
                    {d.companyName && (
                      <p className="text-xs text-[var(--dash-text-muted)]">{d.companyName}</p>
                    )}
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
                    href={`/dashboard/orcamentos?tab=orcamentos&id=${q.id}`}
                    className="dashboard-list-item dashboard-list-item-row"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--brand-navy)]">
                        {q.quoteNumber ?? "Sem número"}
                      </p>
                      <p className="text-xs text-[var(--dash-text-muted)]">{q.companyName}</p>
                    </div>
                    <StatusBadge status={q.status} type="quote" />
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>
        )}
      </div>
    </PageShell>
  );
}
