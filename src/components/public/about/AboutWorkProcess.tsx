"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_WORKFLOW, ABOUT_WORKFLOW_STEPS } from "@/data/about";

export function AboutWorkProcess() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="como-trabalhamos" ref={sectionRef} className="about-v2-process scroll-mt-[var(--header-height)]">
      <div className="container-page about-v2-container">
        <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-v2-section-intro">
          <p className="about-v2-eyebrow about-v2-eyebrow--dark">{ABOUT_WORKFLOW.eyebrow}</p>
          <h2 className="about-v2-section-title">{ABOUT_WORKFLOW.title}</h2>
          <p className="about-v2-section-lead">{ABOUT_WORKFLOW.description}</p>
        </TimelineContent>

        <TimelineContent animationNum={1} timelineRef={sectionRef}>
          <ol className="about-v2-timeline" aria-label="Etapas do processo">
            {ABOUT_WORKFLOW_STEPS.map((step) => (
              <li key={step.step} className="about-v2-timeline-step">
                <div className="about-v2-timeline-marker" aria-hidden>
                  <span className="about-v2-timeline-dot" />
                  <span className="about-v2-timeline-num">{String(step.step).padStart(2, "0")}</span>
                </div>
                <div className="about-v2-timeline-body">
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </TimelineContent>
      </div>
    </section>
  );
}
