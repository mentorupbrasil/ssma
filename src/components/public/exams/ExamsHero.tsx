import { ArrowRight, Search } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { EXAMS_HERO_BADGES } from "@/data/exams-page";

type ExamsHeroProps = {
  whatsappHref: string;
};

export function ExamsHero({ whatsappHref }: ExamsHeroProps) {
  return (
    <section className="exams-hero scroll-mt-[var(--header-height)]">
      <div className="exams-hero-bg" aria-hidden />
      <div className="container-page exams-hero-inner">
        <div className="exams-hero-content animate-fade-up">
          <a href="#preparo-por-exame" className="exams-hero-pill">
            <span>Catálogo de exames e preparos</span>
            <span className="exams-hero-pill-divider" aria-hidden />
            <span className="exams-hero-pill-icon" aria-hidden>
              <ArrowRight className="size-3" />
            </span>
          </a>

          <h1 className="exams-hero-title">Exames e preparos ocupacionais</h1>
          <p className="exams-hero-desc">
            Consulte preparo, prazos e observações para exames ocupacionais solicitados pela
            empresa, PCMSO ou avaliação médica.
          </p>

          <div className="exams-hero-badges" aria-label="Destaques da página">
            {EXAMS_HERO_BADGES.map((badge) => (
              <span key={badge} className="exams-hero-badge">
                {badge}
              </span>
            ))}
          </div>

          <div className="exams-hero-actions">
            <AboutCtaLink
              href="#preparo-por-exame"
              variant="brand"
              size="default"
              className="about-v2-hero-cta about-v2-hero-cta-primary group"
            >
              <Search className="size-4" aria-hidden />
              Buscar exame
            </AboutCtaLink>
            <AboutCtaLink
              href={whatsappHref}
              variant="outline"
              size="default"
              external
              className="about-v2-hero-cta about-v2-hero-cta-secondary group"
            >
              Falar no WhatsApp
            </AboutCtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
