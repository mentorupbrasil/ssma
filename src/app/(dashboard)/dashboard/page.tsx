import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  AlertTriangle,
  FileText,
  ClipboardList,
  FolderOpen,
  Users,
  LifeBuoy,
  Clock,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";
import { QuickActionGrid } from "@/components/dashboard/QuickActionGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { InlineEmptyNote } from "@/components/dashboard/InlineEmptyNote";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { requireAuthSession } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";
import { getDashboardOverview } from "@/lib/dashboard-overview";
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

const CLINIC_STAT_ICONS: Record<string, LucideIcon> = {
  referrals_open: ClipboardList,
  pending_docs: FolderOpen,
  docs_expiring: Clock,
  tickets_open: LifeBuoy,
  companies_pending: Building2,
};

const CLINIC_STAT_TONES: Record<string, string> = {
  referrals_open: "slate",
  pending_docs: "amber",
  docs_expiring: "rose",
  tickets_open: "sky",
  companies_pending: "violet",
};

function formatCompactActivityAt(at: Date) {
  if (isToday(at)) return format(at, "HH:mm");
  if (isYesterday(at)) return `ontem ${format(at, "HH:mm")}`;
  return format(at, "dd/MM HH:mm", { locale: ptBR });
}

export default async function DashboardPage() {
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);
  const overview = await getDashboardOverview(session);

  if (isEmpresa) {
    const quickActions = [
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
    ];

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

  const clinicShortcuts = [
    {
      href: "/dashboard/encaminhamentos",
      label: "Abrir fila de atendimentos",
      icon: ClipboardList,
    },
    {
      href: "/dashboard/documentos",
      label: "Gerenciar documentos",
      icon: FolderOpen,
    },
    {
      href: "/dashboard/empresas",
      label: "Ver empresas",
      icon: Building2,
    },
  ];

  const priorityItems = overview.priorityItems;
  const activities = overview.recentActivities;

  return (
    <PageShell className="visao-geral-clinica" width="wide">
      <header className="vg-header">
        <h1 className="vg-title">Visão geral</h1>
        <p className="vg-subtitle">
          Acompanhe atendimentos, documentos e pendências da operação.
        </p>
      </header>

      <section className="vg-shortcuts" aria-label="Atalhos rápidos">
        {clinicShortcuts.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="vg-shortcut">
            <Icon className="vg-shortcut-icon" aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
      </section>

      <section className="vg-stats" aria-label="Indicadores">
        {overview.stats.map((stat) => {
          const Icon = CLINIC_STAT_ICONS[stat.key] ?? ClipboardList;
          const tone = CLINIC_STAT_TONES[stat.key] ?? "slate";
          return (
            <Link
              key={stat.key}
              href={stat.href}
              className={cn("vg-stat", `vg-stat--${tone}`)}
            >
              <span className="vg-stat-icon" aria-hidden>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="vg-stat-value">{stat.value}</span>
              <span className="vg-stat-title">{stat.title}</span>
            </Link>
          );
        })}
      </section>

      <div
        className={cn(
          "vg-columns",
          priorityItems.length <= 3 && "vg-columns--activity-wide"
        )}
      >
        <section className="vg-panel vg-panel--pending" aria-labelledby="vg-pending-title">
          <h2 id="vg-pending-title" className="vg-panel-title">
            Pendências prioritárias
          </h2>
          {priorityItems.length === 0 ? (
            <p className="vg-empty">Nenhuma pendência no momento</p>
          ) : (
            <ul className="vg-priority-list">
              {priorityItems.map((item) => (
                <li key={`${item.statusType}-${item.id}`} className="vg-priority-item">
                  <div className="vg-priority-main">
                    <p className="vg-priority-title">{item.title}</p>
                    <p className="vg-priority-meta">
                      <span>{item.entityLabel}</span>
                      <span className="vg-priority-dot" aria-hidden>
                        ·
                      </span>
                      <span>{item.kind}</span>
                    </p>
                  </div>
                  <div className="vg-priority-side">
                    <span className="vg-priority-status">{item.status}</span>
                    <Link href={item.href} className="vg-priority-action">
                      {item.actionLabel}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="vg-panel vg-panel--activity" aria-labelledby="vg-activity-title">
          <h2 id="vg-activity-title" className="vg-panel-title">
            Atividades recentes
          </h2>
          {activities.length === 0 ? (
            <p className="vg-empty">Nenhuma atividade recente</p>
          ) : (
            <ul className="vg-activity-list">
              {activities.map((item) => {
                const body = (
                  <>
                    <p className="vg-activity-desc">{item.description}</p>
                    <p className="vg-activity-meta">
                      <span>{item.actor}</span>
                      <span className="vg-priority-dot" aria-hidden>
                        ·
                      </span>
                      <time dateTime={item.at.toISOString()}>
                        {formatCompactActivityAt(item.at)}
                      </time>
                    </p>
                  </>
                );
                return (
                  <li key={item.id} className="vg-activity-item">
                    <span className="vg-activity-dot" aria-hidden />
                    {item.href ? (
                      <Link href={item.href} className="vg-activity-body">
                        {body}
                      </Link>
                    ) : (
                      <div className="vg-activity-body">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/dashboard/auditoria" className="vg-activity-more">
            Ver todas as atividades
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
