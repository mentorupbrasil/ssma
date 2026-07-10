import {
  BadgeCheck,
  Building2,
  Calendar,
  ChevronRight,
  Download,
  FileCheck,
  FileText,
  FolderOpen,
  Lock,
  Users,
} from "lucide-react";

const HERO_SHORTCUTS = [
  { label: "Encaminhamentos", icon: Users },
  { label: "Exames agendados", icon: Calendar },
  { label: "Documentos", icon: FileCheck },
] as const;

const HERO_COLLABORATORS = [
  {
    id: "1",
    initials: "MS",
    name: "Maria Silva",
    exam: "ASO Admissional",
    detail: "Encaminhamento registrado",
    status: "Em análise",
    statusTone: "amber" as const,
    pdfLabel: null,
  },
  {
    id: "2",
    initials: "JO",
    name: "João Oliveira",
    exam: "ASO Periódico",
    detail: "Agendamento confirmado",
    status: "Agendado",
    statusTone: "violet" as const,
    pdfLabel: "PDF · ASO disponível",
  },
  {
    id: "3",
    initials: "AC",
    name: "Ana Costa",
    exam: "ASO Demissional",
    detail: "Exame concluído",
    status: "Concluído",
    statusTone: "emerald" as const,
    pdfLabel: "Baixar PDF",
  },
] as const;

const STATUS_CLASS = {
  amber: "portal-hero-status portal-hero-status--amber",
  violet: "portal-hero-status portal-hero-status--violet",
  emerald: "portal-hero-status portal-hero-status--emerald",
} as const;

/** Mockup premium exclusivo do Hero da Home — não usar em outras páginas. */
export function HomeHeroPortalMockup() {
  return (
    <div className="portal-hero-wrap" aria-hidden>
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

          <div className="portal-hero-shortcuts">
            {HERO_SHORTCUTS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="portal-hero-shortcut">
                  <span className="portal-hero-shortcut-icon">
                    <Icon strokeWidth={1.75} />
                  </span>
                  <span className="portal-hero-shortcut-label">{item.label}</span>
                  <ChevronRight className="portal-hero-shortcut-chevron" strokeWidth={2} />
                </div>
              );
            })}
          </div>

          <div className="portal-hero-main">
            <div className="portal-hero-colab">
              <p className="portal-hero-section-title">Colaboradores encaminhados</p>
              <ul className="portal-hero-colab-list">
                {HERO_COLLABORATORS.map((person) => (
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
