import Link from "next/link";
import { AlertTriangle, ArrowRight, Info } from "lucide-react";
import { COMPLIANCE_DOCS } from "@/data/marketing";
import { COMPLIANCE_DOC_TAGS } from "@/data/home";
import { SectionHeader } from "@/components/public/SectionHeader";
import { Button } from "@/components/ui/button";

const RISK_CONSEQUENCES = [
  "Multas por não conformidade com o Ministério do Trabalho",
  "Inconsistências no eSocial que travam admissões e desligamentos",
  "Interdição de setores em caso de fiscalização de riscos",
  "Passivos trabalhistas em ações e perícias futuras",
] as const;

export function HomeComplianceSection() {
  return (
    <section className="home-compliance scroll-mt-[var(--header-height)]" id="conformidade">
      <div className="container-page">
        <SectionHeader
          eyebrow="Obrigatoriedade legal"
          title="Documentos e programas essenciais para empresas"
          description="PCMSO, ASO, PGR, LTCAT e eventos de SST exigidos conforme a legislação trabalhista — cada um com sua função específica na regularização da empresa."
        />

        <div className="home-compliance-layout">
          <ol className="home-compliance-list">
            {COMPLIANCE_DOCS.map((doc, index) => {
              const Icon = doc.icon;
              const tag = COMPLIANCE_DOC_TAGS[doc.sigla] ?? "Documento";
              return (
                <li key={doc.sigla} className="home-compliance-row">
                  <span className="home-compliance-row-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                  <div className="home-compliance-row-body">
                    <div className="home-compliance-row-head">
                      <p className="home-compliance-row-sigla">
                        {doc.sigla}
                        <span className="home-compliance-row-name">{doc.name}</span>
                      </p>
                      <span className="home-compliance-row-tag">{tag}</span>
                    </div>
                    <p className="home-compliance-row-desc">{doc.description}</p>
                  </div>
                  <span className="home-compliance-row-num" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </li>
              );
            })}
          </ol>

          <aside className="home-compliance-risk">
            <div className="home-compliance-risk-head">
              <div className="home-compliance-risk-icon" aria-hidden>
                <AlertTriangle strokeWidth={1.75} />
              </div>
              <div className="home-compliance-risk-intro">
                <h3 className="home-compliance-risk-title">
                  Documentação fora do prazo custa mais do que parece
                </h3>
                <p className="home-compliance-risk-desc">
                  Sem esses documentos organizados, sua empresa fica exposta a:
                </p>
              </div>
            </div>
            <ul className="home-compliance-risk-list">
              {RISK_CONSEQUENCES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href="/servicos" className="home-compliance-risk-cta">
              <Button variant="brand" className="home-compliance-risk-btn w-full rounded-xl group">
                Ver serviços de SST
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </aside>
        </div>

        <div className="home-compliance-notice" role="note">
          <Info strokeWidth={1.75} aria-hidden />
          <p>
            Cada empresa pode ter exigências diferentes conforme atividade, grau de risco, função e
            PCMSO.
          </p>
        </div>
      </div>
    </section>
  );
}
