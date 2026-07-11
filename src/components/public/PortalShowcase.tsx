import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/public/SectionTitle";
import { HeroPortalMockup } from "@/components/public/HeroPortalMockup";
import { Button } from "@/components/ui/button";

type PortalShowcaseProps = {
  demoMode?: boolean;
  primaryHref?: string;
  secondaryHref?: string;
};

export function PortalShowcase({
  demoMode = false,
  primaryHref = "/login",
  secondaryHref = "/contato?tipo=demonstracao",
}: PortalShowcaseProps) {
  return (
    <section className="portal-showcase-section scroll-mt-[var(--header-height)] overflow-hidden bg-white">
      <div className="container-page">
        <div className="portal-showcase-grid">
          <div className="portal-showcase-copy">
            <SectionTitle
              eyebrow="Diferencial digital"
              title="Portal empresarial que funciona de verdade"
              description="Encaminhe colaboradores, acompanhe status em tempo real e organize documentos sem depender de planilhas e ligações."
              align="left"
              className="portal-block-title"
            />

            <ul className="portal-showcase-list">
              {[
                "Encaminhamento online com protocolo automático",
                "Acompanhamento de status por colaborador",
                "Histórico de exames e documentos",
                "Acesso exclusivo para o RH da empresa",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 text-[var(--brand-green)]" />
                  <span className="text-sm leading-snug sm:text-[0.9375rem]">{item}</span>
                </li>
              ))}
            </ul>

            <div className="portal-showcase-actions">
              <Link href={primaryHref}>
                <Button variant="brand" className="rounded-xl">
                  Conhecer o portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={secondaryHref}>
                <Button variant="outline" className="rounded-xl">
                  Ver demonstração
                </Button>
              </Link>
            </div>
          </div>

          <div id={demoMode ? "portal-demo" : undefined} className="portal-showcase-visual">
            <HeroPortalMockup variant="inline" demoMode={demoMode} />
          </div>
        </div>
      </div>
    </section>
  );
}
