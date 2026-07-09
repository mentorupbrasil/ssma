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
import { PlatformPositioningBanner } from "@/components/dashboard/PlatformPositioningBanner";
import { QuickActionGrid } from "@/components/dashboard/QuickActionGrid";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { InlineEmptyNote } from "@/components/dashboard/InlineEmptyNote";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { requireAuthSession } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";
import { getDashboardOverview } from "@/lib/dashboard-overview";

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
    <div className="dashboard-overview space-y-6">
      <PageHeader
        title="Visão geral"
        description={
          isEmpresa
            ? "Portal empresarial — documentos, encaminhamentos e solicitações da sua empresa"
            : "Cockpit operacional da clínica — pendências, produção e ações prioritárias"
        }
      />

      <PlatformPositioningBanner />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Atalhos rápidos</h2>
        <QuickActionGrid actions={quickActions} />
      </section>

      <div className="dashboard-stats-grid">
        {overview.stats
          .filter((stat) => stat.show)
          .map((stat) => (
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
        <DashboardPanel title="O que precisa de ação agora" icon={AlertTriangle}>
          {overview.pendingActions.length === 0 ? (
            <InlineEmptyNote>Nenhuma pendência crítica no momento.</InlineEmptyNote>
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
          <DashboardPanel title="Atividades recentes — pré-encaminhamentos" icon={FileText}>
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

        <DashboardPanel title="Documentos aguardando arquivo" icon={FolderOpen}>
          {overview.pendingDocuments.length === 0 ? (
            <InlineEmptyNote>Nenhum documento pendente de upload.</InlineEmptyNote>
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
                    <p className="text-xs text-slate-500">{d.companyName ?? "Não informado"}</p>
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
              <InlineEmptyNote>Nenhum orçamento aguardando resposta.</InlineEmptyNote>
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
