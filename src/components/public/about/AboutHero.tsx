"use client";

import { useRef } from "react";

import { AboutHeroPanel } from "@/components/public/about/AboutHeroPanel";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { ABOUT_FLOATING_TAGS } from "@/data/about";

type AboutHeroProps = {
  clinicName: string;
};

export function AboutHero({ clinicName }: AboutHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  const lead = `A ${clinicName} apoia empresas na organização de exames, documentos ocupacionais e rotinas de SST com atendimento presencial e recursos digitais para o RH.`;

  return (
    <section ref={sectionRef} className="about-ed-hero scroll-mt-[var(--header-height)]">
      <div className="about-ed-hero-bg" aria-hidden />
      <div className="container-page">
        <div className="about-ed-hero-grid">
          <div className="about-ed-hero-copy">
            <TimelineContent animationNum={0} timelineRef={sectionRef} eager className="about-ed-hero-meta">
              <p className="about-ed-hero-eyebrow">Institucional</p>
              <ul className="about-ed-hero-tags" aria-label="Áreas de atuação">
                {ABOUT_FLOATING_TAGS.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </TimelineContent>

            <h1 className="about-ed-hero-title">
              <VerticalCutReveal delay={0.04} staggerDuration={0.03}>
                Saúde ocupacional com estrutura, tecnologia e confiança para empresas
              </VerticalCutReveal>
            </h1>

            <TimelineContent animationNum={1} timelineRef={sectionRef} eager className="about-ed-hero-lead">
              <p>{lead}</p>
            </TimelineContent>
          </div>

          <TimelineContent
            animationNum={2}
            timelineRef={sectionRef}
            eager
            as="figure"
            className="about-ed-hero-panel-wrap"
          >
            <AboutHeroPanel clinicName={clinicName} />
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
