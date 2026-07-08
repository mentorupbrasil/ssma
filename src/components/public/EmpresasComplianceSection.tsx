import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EMPRESAS_COMPLIANCE_DOCS } from "@/data/marketing";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

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

        <div className="empresas-compliance-grid">
          {EMPRESAS_COMPLIANCE_DOCS.map((doc) => {
            const Icon = doc.icon;
            return (
              <article key={doc.sigla} className="empresas-compliance-card group">
                <div className="empresas-compliance-card-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <p className="empresas-compliance-sigla">{doc.sigla}</p>
                <h3 className="empresas-compliance-card-title">{doc.name}</h3>
                <p className="empresas-compliance-card-desc">{doc.description}</p>
              </article>
            );
          })}
        </div>

        <div className="empresas-compliance-cta">
          <Link href="/servicos">
            <Button variant="brand" size="lg" className="rounded-xl">
              Ver serviços de regularização
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a
            href={whatsappLink(
              `Olá! Gostaria de falar com um especialista em SST da ${clinic.name}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg" className="rounded-xl">
              Falar com especialista
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
