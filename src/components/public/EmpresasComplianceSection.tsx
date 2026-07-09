import Link from "next/link";
import { ArrowRight, ShieldAlert, CircleAlert } from "lucide-react";
import { EMPRESAS_COMPLIANCE_DOCS } from "@/data/marketing";
import { COMPLIANCE_DOC_TAGS } from "@/data/home";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

const AUTUACAO_RISKS = [
  "Multas em fiscalizações do Ministério do Trabalho",
  "Inconsistências no eSocial que travam admissões",
  "Impedimentos em licitações e auditorias de clientes",
] as const;

export function EmpresasComplianceSection() {
  const clinic = getClinicInfo();

  return (
    <section className="empresas-compliance-section bg-white">
      <div className="container-page">
        <SectionTitle
          eyebrow="Obrigatoriedade legal"
          title="Sua empresa precisa manter esses documentos em dia"
          description="PCMSO, ASO, PGR, LTCAT e eventos de SST no eSocial fazem parte da rotina de empresas que precisam estar regularizadas."
          className="empresas-compliance-title"
        />

        <div className="home-compliance-layout">
          <ol className="home-compliance-list">
            {EMPRESAS_COMPLIANCE_DOCS.map((doc, index) => {
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
            <div className="home-compliance-risk-icon" aria-hidden>
              <ShieldAlert strokeWidth={1.75} />
            </div>
            <h3 className="home-compliance-risk-title">Evite multas e autuações</h3>
            <p className="home-compliance-risk-desc">
              Empresas sem esses documentos organizados ficam expostas a:
            </p>
            <ul className="home-compliance-risk-list">
              {AUTUACAO_RISKS.map((item) => (
                <li key={item}>
                  <CircleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="home-compliance-risk-cta flex flex-col gap-2">
              <Link href="/servicos">
                <Button variant="brand" className="w-full rounded-xl group">
                  Ver serviços de regularização
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <a
                href={whatsappLink(
                  `Olá! Gostaria de falar com um especialista em SST da ${clinic.name}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full rounded-xl">
                  Falar com especialista
                </Button>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
