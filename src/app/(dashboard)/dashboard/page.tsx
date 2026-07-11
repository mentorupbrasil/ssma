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
  Users,
  LifeBuoy,
  Clock,
  CheckCircle2,
  type LucideIcon,
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
import { empresaReferralDisplayStatus } from "@/lib/empresa-portal";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import type { ReferralStatus } from "@prisma/client";

const EMPRESA_STAT_META: Record<
  string,
  { icon: LucideIcon; tone: "primary" | "warning"; hint: string }
> = {
  collaborators_active: {
    icon: Users,
    tone: "primary",
    hint: "Cadastros ativos na empresa",
  },
  referrals_open: {
    icon: ClipboardList,
    tone: "primary",
    hint: "Solicitações em andamento",
  },
  docs_available: {
    icon: FolderOpen,
    tone: "primary",
    hint: "ASOs e laudos liberados",
  },
  periodic_due: {
    icon: Clock,
    tone: "warning",
    hint: "Próximos 30 dias",
  },
  tickets_open: {
    icon: LifeBuoy,
    tone: "primary",
    hint: "Chamados em aberto",
  },
};

export default async function DashboardPage() {
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);
  const overview = await getDashboardOverview(session);

  const quickActions = isEmpresa
    ? [
        {
          href: "/dashboard/colaboradores?new=1",
          label: "Novo colaborador",
          description: "Cadastrar admissional ou individual",
          icon: Users,
        },
        {
          href: "/dashboard/encaminhamentos/novo",
          label: "Solicitar exame",
          description: "Solicitar exames ocupacionais para colaboradores",
          icon: FileText,
        },
        {
          href: "/dashboard/encaminhamentos",
          label: "Acompanhar exames",
          description: "Status dos encaminhamentos enviados",
          icon: ClipboardList,
        },
        {
          href: "/dashboard/documentos?card=PARA_BAIXAR",
          label: "Baixar documentos",
          description: "Documentos anexados pela Unimetra",
          icon: FolderOpen,
        },
      ]
    : [
        { href: "/dashboard/empresas/novo", label: "Nova empresa", description: "Cadastrar cliente corporativo", icon: Building2 },
        { href: "/dashboard/encaminhamentos/novo", label: "Novo encaminhamento", description: "Registrar encaminhamento oficial", icon: FileText },
        { href: "/dashboard/documentos?new=1", label: "Anexar documento", description: "ASO, laudo ou proposta", icon: FolderOpen },
        { href: "/dashboard/fechamento-mensal", label: "Importar produção", description: "Fechamento mensal da clínica", icon: Upload },
        { href: "/dashboard/orcamentos?tab=orcamentos", label: "Novo orçamento", description: "Proposta comercial", icon: DollarSign },
        { href: "/dashboard/tarefas", label: "Nova tarefa", description: "Pendência interna", icon: ClipboardList },
      ];

  if (isEmpresa) {
    const hasPending = overview.pendingActions.length > 0;
    const hasDocs = Boolean(overview.availableDocuments?.length);

    return (
      <PageShell>
        <div className="empresa-overview">
          <section className="empresa-quick-actions">
            <h2 className="empresa-quick-actions-label">Atalhos rápidos</h2>
            <QuickActionGrid actions={quickActions} variant="compact" />
          </section>

          <section>
            <h2 className="empresa-quick-actions-label">Indicadores</h2>
            <div className="colaboradores-empresa-stats empresa-overview-stats">
              {overview.stats.map((stat) => {
                const meta = EMPRESA_STAT_META[stat.key] ?? {
                  icon: ClipboardList,
                  tone: "primary" as const,
                  hint: "",
                };
                const Icon = meta.icon;
                return (
                  <Link
                    key={stat.key}
                    href={stat.href}
                    className="colaboradores-empresa-stat colaboradores-empresa-stat--clickable"
                  >
                    <span
                      className={cn(
                        "colaboradores-empresa-stat-icon",
                        `colaboradores-empresa-stat-icon--${meta.tone}`
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="colaboradores-empresa-stat-body">
                      <span className="colaboradores-empresa-stat-value">{stat.value}</span>
                      <span className="colaboradores-empresa-stat-title">{stat.title}</span>
                      {meta.hint ? (
                        <span className="colaboradores-empresa-stat-hint">{meta.hint}</span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {hasPending ? (
            <DashboardPanel title="Atenção necessária" icon={AlertTriangle}>
              <div className="dashboard-list">
                {overview.pendingActions.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    className="dashboard-list-item"
                  >
                    <p className="text-sm font-semibold text-[var(--brand-navy)]">{item.title}</p>
                    <p className="text-xs text-[var(--dash-text-muted)]">{item.subtitle}</p>
                  </Link>
                ))}
              </div>
            </DashboardPanel>
          ) : (
            <div className="empresa-overview-ok" role="status">
              <CheckCircle2 className="empresa-overview-ok-icon" aria-hidden />
              <p>Tudo em dia — nenhuma pendência crítica.</p>
            </div>
          )}

          <div className={cn("dashboard-panels-grid", !hasDocs && "empresa-overview-panels--single")}>
            <DashboardPanel title="Solicitações recentes" icon={FileText}>
              {!overview.recentReferrals?.length ? (
                <InlineEmptyNote>Nenhuma solicitação recente.</InlineEmptyNote>
              ) : (
                <div className="dashboard-list">
                  {overview.recentReferrals.map((r) => {
                    const display = empresaReferralDisplayStatus(
                      r.status as ReferralStatus,
                      r.scheduledAt
                    );
                    const examLabel =
                      CLINICAL_EXAM_LABELS[r.clinicalExamType] ?? r.clinicalExamType;
                    return (
                      <Link
                        key={r.id}
                        href={`/dashboard/encaminhamentos?id=${r.id}`}
                        className="dashboard-list-item dashboard-list-item-row"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--brand-navy)]">
                            {r.patientName}
                          </p>
                          <p className="text-xs text-[var(--dash-text-muted)]">{examLabel}</p>
                          <p className="text-xs text-[var(--dash-text-subtle)]">
                            {format(r.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <StatusBadge
                          status={display.toneStatus}
                          type="referral"
                          label={display.label}
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </DashboardPanel>

            {hasDocs ? (
              <DashboardPanel title="Prontos para baixar" icon={FolderOpen}>
                <div className="dashboard-list">
                  {overview.availableDocuments!.map((d) => (
                    <Link
                      key={d.id}
                      href={`/dashboard/documentos?id=${d.id}`}
                      className="dashboard-list-item dashboard-list-item-row"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--brand-navy)]">{d.title}</p>
                        {d.patientName && (
                          <p className="text-xs text-[var(--dash-text-muted)]">{d.patientName}</p>
                        )}
                        <p className="text-xs text-[var(--dash-text-subtle)]">
                          {format(d.updatedAt, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </DashboardPanel>
            ) : null}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Cockpit operacional"
        title="Visão geral"
        description="Pendências, produção e ações prioritárias da clínica — atualizado em tempo real."
      />

      <PlatformPositioningBanner />

      <section>
        <h2 className="section-label">Atalhos rápidos</h2>
        <QuickActionGrid actions={quickActions} />
      </section>

      <section>
        <h2 className="section-label">Indicadores</h2>
        <MetricGrid>
          {overview.stats.map((stat) => {
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

        <DashboardPanel title="Atividades recentes" description="Pendências operacionais" icon={FileText}>
          {overview.pendingActions.length === 0 ? (
            <InlineEmptyNote>Nenhuma atividade recente no momento.</InlineEmptyNote>
          ) : (
            <div className="dashboard-list">
              {overview.pendingActions.slice(0, 5).map((item) => (
                <Link key={`${item.type}-${item.id}`} href={item.href} className="dashboard-list-item">
                  <p className="text-sm font-semibold text-[var(--brand-navy)]">{item.title}</p>
                  <p className="text-xs text-[var(--dash-text-muted)]">{item.subtitle}</p>
                </Link>
              ))}
            </div>
          )}
        </DashboardPanel>

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
      </div>
    </PageShell>
  );
}
