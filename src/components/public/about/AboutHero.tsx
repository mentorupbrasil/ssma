"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

import { AboutHeroVisual } from "@/components/public/about/AboutHeroVisual";
import { Button } from "@/components/ui/button";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { ABOUT_HERO_STATS } from "@/data/about";
import type { ClinicSiteConfig } from "@/config/clinic";

type AboutHeroProps = {
  clinicName: string;
  whatsappHref: string;
};

export function AboutHero({ clinicName, whatsappHref }: AboutHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="about-hero scroll-mt-[var(--header-height)]">
      <div className="about-hero-bg" aria-hidden />
      <div className="container-page about-hero-inner">
        <div className="about-hero-grid">
          <div className="about-hero-copy">
            <TimelineContent animationNum={0} timelineRef={sectionRef}>
              <p className="about-eyebrow">Institucional</p>
            </TimelineContent>

            <h1 className="about-hero-title">
              <VerticalCutReveal delay={0.05} staggerDuration={0.035}>
                Saúde ocupacional com estrutura, tecnologia e confiança para empresas
              </VerticalCutReveal>
            </h1>

            <TimelineContent animationNum={1} timelineRef={sectionRef} className="about-hero-desc">
              A {clinicName} apoia empresas na organização de exames, documentos ocupacionais e
              rotinas de SST com atendimento presencial e recursos digitais para o RH.
            </TimelineContent>

            <TimelineContent
              animationNum={2}
              timelineRef={sectionRef}
              className="about-hero-actions"
            >
              <Link href="/contato?tipo=orcamento">
                <Button variant="brand" size="lg" className="rounded-xl">
                  Solicitar orçamento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="rounded-xl border-slate-200 bg-white/80">
                  Falar com especialista
                </Button>
              </a>
            </TimelineContent>

            <TimelineContent animationNum={3} timelineRef={sectionRef} className="about-hero-stats">
              {ABOUT_HERO_STATS.map((stat) => (
                <div key={stat.label} className="about-hero-stat">
                  <span className="about-hero-stat-value">{stat.value}</span>
                  <span className="about-hero-stat-label">{stat.label}</span>
                </div>
              ))}
            </TimelineContent>
          </div>

          <AboutHeroVisual sectionRef={sectionRef} />
        </div>
      </div>
    </section>
  );
}
