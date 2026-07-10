import {
  BadgeCheck,
  Building2,
  Calendar,
  Download,
  FileCheck,
  FileText,
  FolderOpen,
  Lock,
  Users,
} from "lucide-react";

const PORTAL_STATS = [
  { value: "5", label: "Encaminhamentos ativos", icon: Users },
  { value: "2", label: "Exames agendados", icon: Calendar },
  { value: "1", label: "ASOs disponíveis", icon: FileCheck },
] as const;

const PORTAL_COLLABORATORS = [
  {
    id: "1",
    initials: "MS",
    name: "Maria Silva",
    exam: "ASO Admissional",
    detail: "Encaminhado em 05/03",
    status: "Aguardando agendamento",
    statusTone: "amber" as const,
    pdfLabel: null,
  },
  {
    id: "2",
    initials: "JO",
    name: "João Oliveira",
    exam: "ASO Periódico",
    detail: "Agendado para 14/03 · 08h30",
    status: "Agendado",
    statusTone: "violet" as const,
    pdfLabel: null,
  },
  {
    id: "3",
    initials: "AC",
    name: "Ana Costa",
    exam: "Retorno ao trabalho",
    detail: "Exame realizado em 10/03",
    status: "ASO disponível",
    statusTone: "emerald" as const,
    pdfLabel: "PDF · ASO disponível",
  },
] as const;

const STATUS_CLASS = {
  amber: "portal-hero-status portal-hero-status--amber",
  violet: "portal-hero-status portal-hero-status--violet",
  emerald: "portal-hero-status portal-hero-status--emerald",
} as const;

/** Mockup premium da seção Portal na Home — mesma linguagem visual do Hero. */
export function HomePortalMockup() {
  return (
    <div className="portal-hero-wrap home-portal-mockup" aria-hidden>
      <div className="portal-hero-glow" />
      <div className="portal-hero-frame">
        <div className="portal-hero-shell">
          <header className="portal-hero-header">
            <div className="portal-hero-brand">
              <span className="portal-hero-brand-icon">
                <Building2 strokeWidth={1.75} />
              </span>
              <div className="portal-hero-brand-text">
                <p className="portal-hero-brand-title">Portal Empresarial</p>
                <p className="portal-hero-brand-sub">Área do RH · Alfa Indústria Ltda.</p>
              </div>
            </div>
            <span className="portal-hero-demo-badge">Demonstração</span>
          </header>

          <div className="portal-hero-stats">
            {PORTAL_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="portal-hero-stat">
                  <span className="portal-hero-stat-icon">
                    <Icon strokeWidth={1.75} />
                  </span>
                  <p className="portal-hero-stat-value">{stat.value}</p>
                  <p className="portal-hero-stat-label">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="portal-hero-main">
            <div className="portal-hero-colab">
              <p className="portal-hero-section-title">Colaboradores encaminhados</p>
              <ul className="portal-hero-colab-list">
                {PORTAL_COLLABORATORS.map((person) => (
                  <li key={person.id} className="portal-hero-colab-card">
                    <span className="portal-hero-colab-avatar" aria-hidden>
                      {person.initials}
                    </span>
                    <div className="portal-hero-colab-body">
                      <div className="portal-hero-colab-top">
                        <p className="portal-hero-colab-name">{person.name}</p>
                        <span className={STATUS_CLASS[person.statusTone]}>{person.status}</span>
                      </div>
                      <p className="portal-hero-colab-exam">{person.exam}</p>
                      <div className="portal-hero-colab-meta">
                        <p className="portal-hero-colab-detail">{person.detail}</p>
                        {person.pdfLabel && (
                          <span className="portal-hero-pdf-pill">
                            <FileText strokeWidth={1.75} />
                            <span>{person.pdfLabel}</span>
                            <Download strokeWidth={2} />
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="portal-hero-history">
              <p className="portal-hero-section-title">Histórico e documentos</p>
              <div className="portal-hero-history-card">
                <span className="portal-hero-history-icon">
                  <FolderOpen strokeWidth={1.5} />
                </span>
                <p className="portal-hero-history-title">Histórico centralizado</p>
                <p className="portal-hero-history-desc">
                  Exames, ASOs e registros organizados por colaborador.
                </p>
                <span className="portal-hero-history-btn">Ver histórico completo</span>
              </div>
            </aside>
          </div>

          <footer className="portal-hero-footer">
            <span>
              <BadgeCheck strokeWidth={1.75} />
              Protocolo automático a cada encaminhamento
            </span>
            <span>
              <Lock strokeWidth={1.75} />
              Dados protegidos conforme a LGPD
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
