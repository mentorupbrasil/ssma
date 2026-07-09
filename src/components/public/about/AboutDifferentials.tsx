"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { ABOUT_DIFFERENTIALS } from "@/data/about";
import { cn } from "@/lib/utils";

export function AboutDifferentials() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="about-diff">
      <div className="container-page">
        <div className="about-diff-header">
          <TimelineContent animationNum={0} timelineRef={sectionRef}>
            <p className="about-eyebrow about-eyebrow--muted">Diferenciais</p>
          </TimelineContent>
          <h2 className="about-section-heading">
            <VerticalCutReveal delay={0.02}>
              O que torna a Unimetra diferente
            </VerticalCutReveal>
          </h2>
          <TimelineContent animationNum={1} timelineRef={sectionRef} className="about-section-lead">
            Estrutura clínica, organização documental e tecnologia a serviço do RH — com foco em
            confiança e conformidade.
          </TimelineContent>
        </div>

        <div className="about-diff-grid">
          {ABOUT_DIFFERENTIALS.map((item, index) => {
            const Icon = item.icon;
            return (
              <TimelineContent
                key={item.title}
                animationNum={index + 2}
                timelineRef={sectionRef}
                className={cn("about-diff-card", `about-diff-card--${item.accent}`)}
              >
                <div className="about-diff-card-top">
                  <div className="about-diff-card-icon">
                    <Icon strokeWidth={1.75} />
                  </div>
                  <ArrowUpRight className="about-diff-card-arrow" strokeWidth={1.75} />
                </div>
                <h3 className="about-diff-card-title">{item.title}</h3>
                <p className="about-diff-card-text">{item.text}</p>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
