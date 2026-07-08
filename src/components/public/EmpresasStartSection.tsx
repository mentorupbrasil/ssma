import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/public/PageSection";
import { cn } from "@/lib/utils";

const FEATURES = [
  "Cadastrar colaboradores",
  "Emitir encaminhamentos online",
  "Acompanhar status dos exames",
  "Consultar preparo de exames",
  "Solicitar documentos ocupacionais",
  "Centralizar histórico por colaborador",
] as const;

const PORTAL_MODULES = [
  { icon: Users, label: "Colaboradores" },
  { icon: ClipboardList, label: "Encaminhamentos" },
  { icon: FolderOpen, label: "Status" },
  { icon: FileText, label: "Documentos" },
] as const;

const FLOW_STEPS = [
  { label: "Encaminhar", active: true },
  { label: "Acompanhar", active: false },
  { label: "Organizar", active: false },
] as const;

export function EmpresasStartSection() {
  return (
    <PageSection variant="muted" className="empresas-start-section">
      <div className="empresas-start-panel">
        <div className="empresas-start-grid">
          <div className="empresas-start-copy">
            <p className="empresas-start-eyebrow">Portal empresarial</p>
            <h2 className="empresas-start-title">
              Comece a organizar a rotina ocupacional da sua empresa
            </h2>
            <p className="empresas-start-desc">
              Cadastre colaboradores, emita encaminhamentos e acompanhe exames pelo portal
              empresarial.
            </p>

            <ul className="empresas-start-list">
              {FEATURES.map((item) => (
                <li key={item} className="empresas-start-list-item">
                  <CheckCircle2 className="empresas-start-list-icon" strokeWidth={2.25} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="empresas-start-actions">
              <Link href="/contato?tipo=acesso-portal" className="empresas-start-action-link">
                <Button variant="brand" size="lg" className="w-full rounded-xl sm:w-auto">
                  Solicitar acesso ao portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/encaminhamento-online" className="empresas-start-action-link">
                <Button variant="outline" size="lg" className="w-full rounded-xl sm:w-auto">
                  Fazer encaminhamento online
                </Button>
              </Link>
            </div>
          </div>

          <div className="empresas-start-visual" aria-hidden>
            <div className="empresas-start-visual-shell">
              <div className="empresas-start-visual-header">
                <div className="empresas-start-visual-logo">
                  <Building2 className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="empresas-start-visual-title">Portal da Empresa</p>
                  <p className="empresas-start-visual-subtitle">Área exclusiva do RH</p>
                </div>
                <span className="empresas-start-visual-badge">Demonstração</span>
              </div>

              <div className="empresas-start-visual-grid">
                {PORTAL_MODULES.map((module) => {
                  const Icon = module.icon;
                  return (
                    <div key={module.label} className="empresas-start-module">
                      <div className="empresas-start-module-icon">
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <span className="empresas-start-module-label">{module.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="empresas-start-visual-flow">
                {FLOW_STEPS.map((step, index) => (
                  <div key={step.label} className="empresas-start-flow-item">
                    {index > 0 && <span className="empresas-start-flow-line" />}
                    <span
                      className={cn(
                        "empresas-start-flow-step",
                        step.active && "empresas-start-flow-step--active"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  );
}
