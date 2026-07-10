"use client";

import { useRef } from "react";
import { ArrowRight, Phone } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { AboutHeroPanel } from "@/components/public/about/AboutHeroPanel";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_HERO } from "@/data/about";
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
    <section ref={sectionRef} className="about-ed-hero scroll-mt-[var(--header-height)]">
      <div className="about-ed-hero-bg" aria-hidden />
      <div className="about-ed-hero-glow about-ed-hero-glow--a" aria-hidden />
      <div className="about-ed-hero-glow about-ed-hero-glow--b" aria-hidden />

      <div className="container-page about-ed-page about-ed-hero-container">
        <div className="about-ed-hero-grid">
          <div className="about-ed-hero-copy">
            <TimelineContent animationNum={0} timelineRef={sectionRef} eager>
              <p className="about-ed-hero-eyebrow">{ABOUT_HERO.eyebrow}</p>
            </TimelineContent>

            <TimelineContent animationNum={1} timelineRef={sectionRef} eager>
              <h1 className="about-ed-hero-title">{ABOUT_HERO.title}</h1>
            </TimelineContent>

            <TimelineContent animationNum={2} timelineRef={sectionRef} eager>
              <p className="about-ed-hero-lead">{ABOUT_HERO.description}</p>
            </TimelineContent>

            <TimelineContent animationNum={3} timelineRef={sectionRef} eager>
              <div className="about-ed-hero-actions">
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
          </div>

          <TimelineContent
            animationNum={4}
            timelineRef={sectionRef}
            eager
            className="about-ed-hero-visual-slot"
          >
            <AboutHeroPanel />
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
