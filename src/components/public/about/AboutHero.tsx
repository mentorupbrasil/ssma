"use client";

import { useRef } from "react";
import { ArrowRight, Phone } from "lucide-react";

import { AboutBrandFrame } from "@/components/public/about/AboutBrandFrame";
import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_HERO, ABOUT_HERO_STRIP } from "@/data/about";
import { whatsappLink } from "@/lib/helpers";

type AboutHeroProps = {
  clinicName: string;
};

export function AboutHero({ clinicName }: AboutHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com um especialista da ${clinicName}.`
  );

  return (
    <section ref={sectionRef} className="about-v2-hero scroll-mt-[var(--header-height)]">
      <div className="container-page about-v2-container">
        <div className="about-v2-hero-grid">
          <div className="about-v2-hero-copy">
            <TimelineContent animationNum={0} timelineRef={sectionRef} eager>
              <p className="about-v2-eyebrow">{ABOUT_HERO.eyebrow}</p>
            </TimelineContent>

            <TimelineContent animationNum={1} timelineRef={sectionRef} eager>
              <h1 className="about-v2-hero-title">{ABOUT_HERO.title}</h1>
            </TimelineContent>

            <TimelineContent animationNum={2} timelineRef={sectionRef} eager>
              <p className="about-v2-hero-lead">{ABOUT_HERO.description}</p>
            </TimelineContent>

            <TimelineContent animationNum={3} timelineRef={sectionRef} eager>
              <div className="about-v2-hero-actions">
                <AboutCtaLink href={whatsappHref} variant="brand" size="lg" external>
                  {ABOUT_HERO.primaryCta}
                  <Phone className="size-4" aria-hidden />
                </AboutCtaLink>
                <AboutCtaLink href="/servicos" variant="outline-light" size="lg">
                  {ABOUT_HERO.secondaryCta}
                  <ArrowRight className="size-4" aria-hidden />
                </AboutCtaLink>
              </div>
            </TimelineContent>

            <TimelineContent animationNum={4} timelineRef={sectionRef} eager>
              <ul className="about-v2-hero-strip" aria-label="Áreas de atuação">
                {ABOUT_HERO_STRIP.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </TimelineContent>
          </div>

          <TimelineContent animationNum={5} timelineRef={sectionRef} eager className="about-v2-hero-visual">
            <AboutBrandFrame
              image={ABOUT_HERO.image}
              alt={ABOUT_HERO.imageAlt}
              variant="hero"
              badge="Imperatriz — MA"
              caption="Medicina e Segurança do Trabalho"
            />
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
