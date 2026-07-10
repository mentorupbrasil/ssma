"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_WORKFLOW, ABOUT_WORKFLOW_STEPS } from "@/data/about";

export function AboutWorkProcess() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="como-trabalhamos" ref={sectionRef} className="about-v2-process scroll-mt-[var(--header-height)]">
      <div className="container-page about-v2-container">
        <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-v2-sec-head about-v2-sec-head--center">
          <span className="about-v2-sec-index" aria-hidden>
            05
          </span>
          <div className="about-v2-sec-head-copy">
            <p className="about-v2-eyebrow about-v2-eyebrow--dark">{ABOUT_WORKFLOW.eyebrow}</p>
            <h2 className="about-v2-section-title">{ABOUT_WORKFLOW.title}</h2>
            <p className="about-v2-section-lead about-v2-section-lead--inline">{ABOUT_WORKFLOW.description}</p>
          </div>
        </TimelineContent>

        <TimelineContent animationNum={1} timelineRef={sectionRef}>
          <div className="about-v2-process-shell">
            <ol className="about-v2-process-track" aria-label="Etapas do processo">
              {ABOUT_WORKFLOW_STEPS.map((step) => (
                <li key={step.step} className="about-v2-process-step">
                  <div className="about-v2-process-index" aria-hidden>
                    <span>{String(step.step).padStart(2, "0")}</span>
                  </div>
                  <div className="about-v2-process-content">
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
