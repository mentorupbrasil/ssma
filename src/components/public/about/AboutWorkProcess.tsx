"use client";

import { useRef } from "react";

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
      <div className="container-page">
        <div className="about-ed-process-header">
          <TimelineContent animationNum={0} timelineRef={sectionRef}>
            <p className="about-ed-label">Como trabalhamos</p>
          </TimelineContent>
          <TimelineContent animationNum={1} timelineRef={sectionRef}>
            <h2 className="about-ed-heading">Nossa forma de trabalhar</h2>
          </TimelineContent>
          <TimelineContent animationNum={2} timelineRef={sectionRef} className="about-ed-process-lead">
            Um fluxo claro do diagnóstico da necessidade até a entrega documental, com suporte ao RH
            em cada etapa.
          </TimelineContent>
        </div>

        <ol className="about-ed-timeline">
          {ABOUT_WORKFLOW_STEPS.map((step, index) => (
            <TimelineContent
              key={step.step}
              animationNum={index + 3}
              timelineRef={sectionRef}
              as="li"
              className="about-ed-timeline-step"
            >
              <span className="about-ed-timeline-num" aria-hidden>
                {String(step.step).padStart(2, "0")}
              </span>
              <div className="about-ed-timeline-body">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </TimelineContent>
          ))}
        </ol>
      </div>
    </section>
  );
}
