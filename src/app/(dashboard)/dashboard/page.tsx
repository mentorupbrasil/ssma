import Link from "next/link";
import { format } from "date-fns";
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
  ArrowRight,
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
import { normalizeRole } from "@/lib/tenant";
import { resolveClinicId } from "@/lib/scoped-db";
import { getClinicBillingNotice } from "@/lib/syncpay/billing-notice";

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

const CLINIC_STAT_META: Record<
  string,
  { icon: LucideIcon; tone: "primary" | "warning"; label: string; hint: string }
> = {
  referrals_open: {
    icon: ClipboardList,
    tone: "primary",
    label: "Atendimentos em aberto",
    hint: "Aguardando confirmação ou atendimento",
  },
  pending_docs: {
    icon: FolderOpen,
    tone: "warning",
    label: "Documentos pendentes",
    hint: "Emissão ou elaboração pendente",
  },
  docs_expiring: {
    icon: Clock,
    tone: "warning",
    label: "Documentos a vencer",
    hint: "Vencem nos próximos 30 dias",
  },
  tickets_open: {
    icon: LifeBuoy,
    tone: "primary",
    label: "Chamados abertos",
    hint: "Suporte em andamento",
  },
  companies_pending: {
    icon: Building2,
    tone: "warning",
    label: "Empresas pendentes",
    hint: "Documentação incompleta",
  },
};

export default async function DashboardPage() {
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);
  const overview = await getDashboardOverview(session);
  const isClinicAdmin = !isEmpresa && normalizeRole(session.user.role) === "CLINIC_ADMIN";
  const billingNotice = isClinicAdmin
    ? await getClinicBillingNotice(await resolveClinicId(session)).catch(() => null)
    : null;

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

  const priorityItems = overview.priorityItems;
  const hasPriority = priorityItems.length > 0;

  return (
    <PageShell className="visao-geral-clinica" width="wide">
      <header className="sys-page-header">
        <div>
          <h1 className="sys-page-title">Visão geral</h1>
          <p className="sys-page-subtitle">
            Acompanhe atendimentos, documentos e pendências da operação.
          </p>
        </div>
      </header>

      {billingNotice ? (
        <div
          className={cn(
            "vg-billing-notice",
            billingNotice.tone === "danger" && "vg-billing-notice--danger",
            billingNotice.tone === "warning" && "vg-billing-notice--warning"
          )}
          role="status"
        >
          <p>{billingNotice.message}</p>
          <Link href="/dashboard/assinatura" className="vg-billing-notice-action">
            Pagar mensalidade
          </Link>
        </div>
      ) : null}

      <section>
        <h2 className="empresa-quick-actions-label">Indicadores</h2>
        <div className="vg-kpi-grid">
          {overview.stats.map((stat) => {
            const meta = CLINIC_STAT_META[stat.key] ?? {
              icon: ClipboardList,
              tone: "primary" as const,
              label: stat.title,
              hint: "",
            };
            const Icon = meta.icon;
            return (
              <Link
                key={stat.key}
                href={stat.href}
                className={cn("vg-kpi-card", `vg-kpi-card--${meta.tone}`)}
              >
                <span className="vg-kpi-card-icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="vg-kpi-value">{stat.value}</span>
                <span className="vg-kpi-title">{meta.label}</span>
                {meta.hint ? <span className="vg-kpi-hint">{meta.hint}</span> : null}
              </Link>
            );
          })}
        </div>
      </section>

      {hasPriority ? (
        <DashboardPanel title="Pendências prioritárias" icon={AlertTriangle}>
          <div className="dashboard-list">
            {priorityItems.map((item) => (
              <Link
                key={`${item.statusType}-${item.id}`}
                href={item.href}
                className="dashboard-list-item dashboard-list-item-row"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--brand-navy)]">{item.title}</p>
                  <p className="text-xs text-[var(--dash-text-muted)]">
                    {item.entityLabel} · {item.kind}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge
                    status={item.status}
                    type={
                      item.statusType === "ticket"
                        ? "contact"
                        : item.statusType === "company"
                          ? "company"
                          : item.statusType
                    }
                    label={item.status}
                  />
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--brand-green)]">
                    {item.actionLabel}
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                </div>
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
    </PageShell>
  );
}
