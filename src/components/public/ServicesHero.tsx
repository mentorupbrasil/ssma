import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { SERVICES_HERO_BADGES } from "@/data/services";

type ServicesHeroProps = {
  whatsappHref: string;
};

export function ServicesHero({ whatsappHref }: ServicesHeroProps) {
  return (
    <section className="services-hero scroll-mt-[var(--header-height)]">
      <div className="services-hero-bg" aria-hidden />
      <div className="container-page services-hero-inner">
        <div className="services-hero-content animate-fade-up">
          <Link href="#medicina-ocupacional" className="services-hero-pill">
            <span>Portfólio completo</span>
            <span className="services-hero-pill-divider" aria-hidden />
            <span className="services-hero-pill-icon" aria-hidden>
              <ArrowRight className="size-3" />
            </span>
          </Link>

          <h1 className="services-hero-title">
            Soluções completas em Saúde e Segurança do Trabalho para empresas
          </h1>
          <p className="services-hero-desc">
            Exames ocupacionais, programas, laudos, documentação e suporte ao RH para manter sua
            empresa em conformidade com mais organização.
          </p>

          <div className="services-hero-badges" aria-label="Áreas de atuação">
            {SERVICES_HERO_BADGES.map((badge) => (
              <span key={badge} className="services-hero-badge">
                {badge}
              </span>
            ))}
          </div>

          <div className="services-hero-actions">
            <AboutCtaLink
              href="/contato?tipo=orcamento"
              variant="brand"
              size="default"
              className="about-v2-hero-cta about-v2-hero-cta-primary group"
            >
              Solicitar orçamento
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </AboutCtaLink>
            <AboutCtaLink
              href={whatsappHref}
              variant="outline"
              size="default"
              external
              className="about-v2-hero-cta about-v2-hero-cta-secondary group"
            >
              Falar com especialista
            </AboutCtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
