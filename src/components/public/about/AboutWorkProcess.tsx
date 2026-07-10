"use client";

import { useRef } from "react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_WORKFLOW, ABOUT_WORKFLOW_STEPS } from "@/data/about";

export function AboutWorkProcess() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="como-trabalhamos"
      ref={sectionRef}
      className="about-ed-process scroll-mt-[var(--header-height)]"
    >
      <div className="container-page about-ed-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow={ABOUT_WORKFLOW.eyebrow}
            title={ABOUT_WORKFLOW.title}
            description={ABOUT_WORKFLOW.description}
            className="about-ed-section-header"
          />
        </TimelineContent>

        <ol className="about-ed-workflow">
          {ABOUT_WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <TimelineContent
                key={step.step}
                animationNum={index + 1}
                timelineRef={sectionRef}
                as="li"
                className="about-ed-workflow-step"
              >
                <div className="about-ed-workflow-step-head">
                  <span className="about-ed-workflow-num" aria-hidden>
                    {String(step.step).padStart(2, "0")}
                  </span>
                  <span className="about-ed-workflow-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                </div>
                <div className="about-ed-workflow-body">
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
