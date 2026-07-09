import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/public/SectionHeader";
import { HeroPortalMockup } from "@/components/public/HeroPortalMockup";
import { Button } from "@/components/ui/button";
import { PORTAL_BENEFITS } from "@/data/home";

export function HomePortalSection() {
  return (
    <section className="home-portal scroll-mt-[var(--header-height)]" id="portal-empresarial">
      <div className="container-page">
        <div className="home-portal-grid">
          <div className="home-portal-copy">
            <SectionHeader
              eyebrow="Diferencial digital"
              title="Portal empresarial para simplificar a rotina do RH"
              description="Encaminhe colaboradores, acompanhe status, organize documentos e reduza controles por WhatsApp, planilhas e ligações."
            />

            <ul className="home-portal-benefits">
              {PORTAL_BENEFITS.map((item) => (
                <li key={item} className="home-portal-benefit">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="home-portal-actions">
              <Link href="/empresas">
                <Button variant="brand" className="rounded-xl">
                  Conhecer portal empresarial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contato?tipo=demonstracao">
                <Button variant="outline" className="rounded-xl">
                  Solicitar demonstração
                </Button>
              </Link>
            </div>
          </div>

          <div className="home-portal-visual">
            <HeroPortalMockup variant="inline" />
          </div>
        </div>
      </div>
    </section>
  );
}
