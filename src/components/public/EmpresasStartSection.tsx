import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function EmpresasStartSection() {
  return (
    <section className="empresas-start-section scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <div className="empresas-start-card">
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
                <Link href="/contato?tipo=acesso-portal" className="empresas-start-action-primary">
                  <Button variant="brand" size="lg" className="w-full rounded-xl sm:w-auto">
                    Solicitar acesso ao portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/encaminhamento-online" className="empresas-start-action-secondary">
                  <Button variant="outline" size="lg" className="w-full rounded-xl sm:w-auto">
                    Fazer encaminhamento online
                  </Button>
                </Link>
              </div>
            </div>

            <div className="empresas-start-visual" aria-hidden>
              <div className="empresas-start-visual-shell">
                <p className="empresas-start-visual-label">Resumo do portal</p>
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
                  <span className={cn("empresas-start-flow-step", "empresas-start-flow-step--active")}>
                    Encaminhar
                  </span>
                  <span className="empresas-start-flow-line" />
                  <span className="empresas-start-flow-step">Acompanhar</span>
                  <span className="empresas-start-flow-line" />
                  <span className="empresas-start-flow-step">Organizar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
