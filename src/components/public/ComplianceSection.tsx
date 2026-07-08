import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { COMPLIANCE_DOCS } from "@/data/marketing";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

type ComplianceSectionProps = {
  hideAlert?: boolean;
  compactTop?: boolean;
};

export function ComplianceSection({ hideAlert = false, compactTop = false }: ComplianceSectionProps) {
  const clinic = getClinicInfo();

  return (
    <section
      className={cn(
        "compliance-section bg-white",
        compactTop && "compliance-section--compact-top"
      )}
    >
      <div className="container-page">
        {!hideAlert && (
        <div className="compliance-alert">
          <div className="compliance-alert-content">
            <div className="compliance-alert-icon" aria-hidden>
              <ShieldAlert className="h-5 w-5 text-amber-700" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9375rem] font-semibold tracking-tight text-[var(--brand-navy)]">
                Evite multas e autuações
              </p>
              <p className="mt-0.5 text-sm leading-snug text-slate-600">
                Empresas irregulares estão sujeitas a penalidades em fiscalizações do MTE e
                inconsistências no eSocial.
              </p>
            </div>
          </div>
          <a
            href={whatsappLink(
              `Olá! Gostaria de falar com um especialista em SST da ${clinic.name}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="compliance-alert-action shrink-0"
          >
            <Button variant="outline" size="sm" className="compliance-alert-btn w-full sm:w-auto">
              Falar com especialista
            </Button>
          </a>
        </div>
        )}

        <SectionTitle
          eyebrow="Obrigatoriedade legal"
          title="Esses documentos são exigidos para sua empresa"
          description="Mantenha sua operação em dia com programas, laudos, exames e eventos obrigatórios conforme a legislação trabalhista."
          className="compliance-section-title"
        />

        <div className="compliance-docs-grid">
          {COMPLIANCE_DOCS.map((doc) => {
            const Icon = doc.icon;
            return (
              <div key={doc.sigla} className="compliance-doc-card group">
                <div className="compliance-doc-card-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <p className="compliance-doc-sigla">{doc.sigla}</p>
                <h3 className="compliance-doc-title">{doc.name}</h3>
                <p className="compliance-doc-desc">{doc.description}</p>
              </div>
            );
          })}
        </div>

        <div className="compliance-section-cta">
          <Link href="/servicos">
            <Button variant="outline" size="lg" className="compliance-cta-btn group">
              Ver todos os serviços
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-250 group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
