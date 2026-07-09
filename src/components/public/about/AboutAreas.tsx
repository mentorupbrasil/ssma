"use client";

import { useRef } from "react";
import { Check } from "lucide-react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { ABOUT_EXPERTISE } from "@/data/about";

export function AboutAreas() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="areas-atuacao"
      ref={sectionRef}
      className="about-areas scroll-mt-[var(--header-height)]"
    >
      <div className="container-page">
        <div className="about-areas-header">
          <TimelineContent animationNum={0} timelineRef={sectionRef}>
            <p className="about-eyebrow about-eyebrow--muted">Áreas de atuação</p>
          </TimelineContent>
          <h2 className="about-section-heading">
            <VerticalCutReveal delay={0.02}>
              Medicina, Segurança e gestão ocupacional integradas
            </VerticalCutReveal>
          </h2>
          <TimelineContent animationNum={1} timelineRef={sectionRef} className="about-section-lead">
            Atuação completa para apoiar empresas em exames, programas, laudos e rotinas digitais de
            SST.
          </TimelineContent>
        </div>

        <div className="about-areas-grid">
          {ABOUT_EXPERTISE.map((area, index) => {
            const Icon = area.icon;
            return (
              <TimelineContent
                key={area.title}
                animationNum={index + 2}
                timelineRef={sectionRef}
                className="about-areas-card"
              >
                <div className="about-areas-card-head">
                  <div className="about-areas-card-icon">
                    <Icon strokeWidth={1.75} />
                  </div>
                  <h3 className="about-areas-card-title">{area.title}</h3>
                </div>
                <p className="about-areas-card-desc">{area.text}</p>
                <ul className="about-areas-card-list">
                  {area.items.map((item) => (
                    <li key={item}>
                      <Check className="about-areas-card-check" strokeWidth={2.5} aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
