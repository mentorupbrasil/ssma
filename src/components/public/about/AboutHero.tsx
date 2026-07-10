import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { ABOUT_HERO, ABOUT_HERO_STRIP } from "@/data/about";
import { whatsappLink } from "@/lib/helpers";

type AboutHeroProps = {
  clinicName: string;
};

export function AboutHero({ clinicName }: AboutHeroProps) {
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com um especialista da ${clinicName}.`
  );

  return (
    <section className="about-v2-hero scroll-mt-[var(--header-height)]">
      <div className="about-v2-hero-glows" aria-hidden>
        <div className="about-v2-hero-glow about-v2-hero-glow--a" />
        <div className="about-v2-hero-glow about-v2-hero-glow--b" />
        <div className="about-v2-hero-glow about-v2-hero-glow--c" />
      </div>
      <div className="about-v2-hero-fade" aria-hidden />

      <div className="container-page about-v2-container">
        <div className="about-v2-hero-inner animate-fade-up">
          <Link href="#nossa-historia" className="about-v2-hero-pill">
            <span>{ABOUT_HERO.eyebrow}</span>
            <span className="about-v2-hero-pill-divider" aria-hidden />
            <span className="about-v2-hero-pill-icon" aria-hidden>
              <ArrowRight className="size-3" />
            </span>
          </Link>

          <h1 className="about-v2-hero-title">{ABOUT_HERO.title}</h1>

          <p className="about-v2-hero-lead">{ABOUT_HERO.description}</p>

          <div className="about-v2-hero-actions">
            <div className="about-v2-hero-cta-ring">
              <AboutCtaLink href={whatsappHref} variant="brand" size="lg" external>
                {ABOUT_HERO.primaryCta}
                <Phone className="size-4" aria-hidden />
              </AboutCtaLink>
            </div>
            <AboutCtaLink
              href="/servicos"
              variant="outline"
              size="lg"
              className="about-v2-hero-cta-secondary"
            >
              {ABOUT_HERO.secondaryCta}
              <ArrowRight className="size-4" aria-hidden />
            </AboutCtaLink>
          </div>

          <ul className="about-v2-hero-strip" aria-label="Áreas de atuação">
            {ABOUT_HERO_STRIP.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
