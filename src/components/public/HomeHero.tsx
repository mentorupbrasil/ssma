import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPortalMockup } from "@/components/public/HeroPortalMockup";
import { HOME_HERO_BADGES } from "@/data/home";
import { getClinicSiteConfig } from "@/config/clinic";
import { whatsappLink } from "@/lib/helpers";

export function HomeHero() {
  const config = getClinicSiteConfig();
  const locationLabel = [config.city, config.state].filter(Boolean).join(" — ");
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com a ${config.clinicName} sobre saúde ocupacional.`
  );

  return (
    <section className="home-hero scroll-mt-[var(--header-height)]">
      <div className="home-hero-bg" aria-hidden />
      <div className="container-page home-hero-grid">
        <div className="home-hero-copy">
          <p className="home-hero-eyebrow">
            Medicina e Segurança do Trabalho{locationLabel ? ` em ${locationLabel}` : ""}
          </p>
          <h1 className="home-hero-title">
            Saúde ocupacional, documentos e conformidade para empresas com mais organização
          </h1>
          <p className="home-hero-desc">
            Exames ocupacionais, ASO, PCMSO, PGR, laudos e encaminhamentos com atendimento
            presencial e suporte digital para o RH.
          </p>

          <div className="home-hero-badges" aria-label="Destaques">
            {HOME_HERO_BADGES.map((badge) => (
              <span key={badge} className="home-hero-badge">
                {badge}
              </span>
            ))}
          </div>

          <div className="home-hero-actions">
            <Link href="/contato?tipo=orcamento">
              <Button variant="brand" size="lg" className="rounded-xl">
                Solicitar orçamento
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <Button variant="outline-light" size="lg" className="rounded-xl">
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>

        <div className="home-hero-visual">
          <HeroPortalMockup variant="hero" className="home-hero-mockup" />
        </div>
      </div>
    </section>
  );
}
