"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { ABOUT_WORKFLOW_STEPS } from "@/data/about";

export function AboutWorkProcess() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="forma-de-trabalhar"
      ref={sectionRef}
      className="about-process scroll-mt-[var(--header-height)]"
    >
      <div className="container-page">
        <div className="about-process-header">
          <TimelineContent animationNum={0} timelineRef={sectionRef}>
            <p className="about-eyebrow about-eyebrow--muted">Como trabalhamos</p>
          </TimelineContent>
          <h2 className="about-section-heading about-section-heading--center">
            <VerticalCutReveal delay={0.02}>
              Nossa forma de trabalhar com empresas
            </VerticalCutReveal>
          </h2>
          <TimelineContent animationNum={1} timelineRef={sectionRef} className="about-section-lead">
            Um fluxo claro do diagnóstico da necessidade até a entrega documental, com suporte ao RH
            em cada etapa.
          </TimelineContent>
        </div>

        <div className="about-process-track">
          {ABOUT_WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <TimelineContent
                key={step.step}
                animationNum={index + 2}
                timelineRef={sectionRef}
                className="about-process-step"
              >
                <div className="about-process-step-rail" aria-hidden>
                  <span className="about-process-step-num">{step.step}</span>
                  {index < ABOUT_WORKFLOW_STEPS.length - 1 && (
                    <span className="about-process-step-line" />
                  )}
                </div>
                <div className="about-process-step-body">
                  <div className="about-process-step-icon">
                    <Icon strokeWidth={1.75} />
                  </div>
                  <h3 className="about-process-step-title">{step.title}</h3>
                  <p className="about-process-step-text">{step.text}</p>
                </div>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
