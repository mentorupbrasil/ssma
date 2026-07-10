import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/public/SectionHeader";
import { HomePortalMockup } from "@/components/public/HomePortalMockup";
import { Button } from "@/components/ui/button";
import { PORTAL_BENEFITS } from "@/data/home";

export function HomePortalSection() {
  return (
    <section className="home-portal scroll-mt-[var(--header-height)]" id="portal-empresarial">
      <div className="home-portal-bg" aria-hidden />
      <div className="container-page relative">
        <div className="home-portal-grid">
          <div className="home-portal-copy">
            <SectionHeader
              eyebrow="Diferencial digital"
              title="Portal empresarial para simplificar a rotina do RH"
              description="Encaminhe colaboradores, acompanhe status, organize documentos e reduza controles por WhatsApp, planilhas e ligações."
              className="home-portal-header"
            />

            <ul className="home-portal-benefits">
              {PORTAL_BENEFITS.map((item) => (
                <li key={item} className="home-portal-benefit">
                  <span className="home-portal-benefit-icon" aria-hidden>
                    <CheckCircle2 strokeWidth={1.75} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="home-portal-actions">
              <Link href="/empresas">
                <Button variant="brand" className="rounded-xl group">
                  Conhecer portal empresarial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
            <HomePortalMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
