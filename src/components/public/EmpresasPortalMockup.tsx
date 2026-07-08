import { Building2, Calendar, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const PORTAL_MODULES = [
  { icon: Send, label: "Encaminhamentos" },
  { icon: Calendar, label: "Exames agendados" },
  { icon: FileText, label: "Documentos" },
] as const;

const STATUS_STEPS = [
  { label: "Novo", tone: "slate" },
  { label: "Em análise", tone: "amber" },
  { label: "Agendado", tone: "violet" },
  { label: "Concluído", tone: "emerald" },
] as const;

const STATUS_TONE_CLASS = {
  slate: "empresas-portal-status--slate",
  amber: "empresas-portal-status--amber",
  violet: "empresas-portal-status--violet",
  emerald: "empresas-portal-status--emerald",
} as const;

type EmpresasPortalMockupProps = {
  className?: string;
};

export function EmpresasPortalMockup({ className }: EmpresasPortalMockupProps) {
  return (
    <div className={cn("empresas-portal-mockup", className)} aria-hidden>
      <div className="empresas-portal-mockup-shell">
        <div className="empresas-portal-mockup-header">
          <div className="empresas-portal-mockup-logo">
            <Building2 className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <p className="empresas-portal-mockup-title">Portal da Empresa</p>
            <p className="empresas-portal-mockup-subtitle">Área exclusiva do RH</p>
          </div>
        </div>

        <div className="empresas-portal-mockup-modules">
          {PORTAL_MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.label} className="empresas-portal-module">
                <div className="empresas-portal-module-icon">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </div>
                <span className="empresas-portal-module-label">{module.label}</span>
              </div>
            );
          })}
        </div>

        <div className="empresas-portal-mockup-status-block">
          <p className="empresas-portal-mockup-status-label">Fluxo de acompanhamento</p>
          <ul className="empresas-portal-mockup-status-list">
            {STATUS_STEPS.map((step) => (
              <li
                key={step.label}
                className={cn("empresas-portal-status", STATUS_TONE_CLASS[step.tone])}
              >
                <span className="empresas-portal-status-dot" />
                {step.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
