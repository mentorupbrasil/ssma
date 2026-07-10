"use client";

import { useRef } from "react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_WORKFLOW_STEPS } from "@/data/about";

export function AboutWorkProcess() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="forma-de-trabalhar"
      ref={sectionRef}
      className="about-ed-process scroll-mt-[var(--header-height)]"
    >
      <div className="container-page about-ed-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow="Como trabalhamos"
            title="Nossa forma de trabalhar"
            description="Um fluxo claro do diagnóstico da necessidade até a entrega documental, com suporte ao RH em cada etapa."
            className="about-ed-section-header"
          />
        </TimelineContent>

        <ol className="about-ed-timeline">
          {ABOUT_WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <TimelineContent
                key={step.step}
                animationNum={index + 1}
                timelineRef={sectionRef}
                as="li"
                className="about-ed-timeline-step"
              >
                <div className="about-ed-timeline-head">
                  <span className="about-ed-timeline-num" aria-hidden>
                    {String(step.step).padStart(2, "0")}
                  </span>
                  <span className="about-ed-timeline-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                </div>
                <div className="about-ed-timeline-body">
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </TimelineContent>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
