import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { COMPLIANCE_DOCS } from "@/data/marketing";
import { SectionHeader } from "@/components/public/SectionHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HomeComplianceSectionProps = {
  className?: string;
};

export function HomeComplianceSection({ className }: HomeComplianceSectionProps) {
  return (
    <section
      className={cn("home-compliance scroll-mt-[var(--header-height)]", className)}
      id="conformidade"
    >
      <div className="container-page">
        <div className="home-compliance-trust">
          <div className="home-compliance-trust-icon" aria-hidden>
            <ShieldCheck strokeWidth={1.75} />
          </div>
          <div>
            <p className="home-compliance-trust-title">
              Conformidade ocupacional exige rotina, documentação e acompanhamento.
            </p>
            <p className="home-compliance-trust-desc">
              A Unimetra ajuda empresas a manter exames, ASOs, programas e laudos organizados para
              reduzir riscos e pendências.
            </p>
          </div>
        </div>

        <SectionHeader
          eyebrow="Obrigatoriedade legal"
          title="Documentos e programas essenciais para empresas"
          description="PCMSO, ASO, PGR, LTCAT e eventos de SST exigidos conforme a legislação trabalhista."
        />

        <div className="home-compliance-grid">
          {COMPLIANCE_DOCS.map((doc) => {
            const Icon = doc.icon;
            return (
              <article key={doc.sigla} className="home-compliance-card group">
                <div className="home-compliance-card-top">
                  <div className="home-compliance-card-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </div>
                  <span className="home-compliance-card-tag">{doc.tag}</span>
                </div>
                <p className="home-compliance-sigla">{doc.sigla}</p>
                <h3 className="home-compliance-name">{doc.name}</h3>
                <p className="home-compliance-desc">{doc.description}</p>
              </article>
            );
          })}
        </div>

        <p className="home-compliance-footnote">
          Cada empresa pode ter exigências diferentes conforme atividade, grau de risco, função e
          PCMSO.
        </p>

        <div className="home-compliance-cta">
          <Link href="/servicos">
            <Button variant="outline" size="lg" className="rounded-xl group">
              Ver serviços de SST
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
