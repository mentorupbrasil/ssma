"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_VALUES, ABOUT_VALUES_SECTION } from "@/data/about";

export function AboutMissionVision() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="proposito-missao-visao" ref={sectionRef} className="about-v2-values scroll-mt-[var(--header-height)]">
      <div className="container-page about-v2-container">
        <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-v2-section-intro about-v2-section-intro--center">
          <p className="about-v2-eyebrow about-v2-eyebrow--dark">{ABOUT_VALUES_SECTION.eyebrow}</p>
          <h2 className="about-v2-section-title">{ABOUT_VALUES_SECTION.title}</h2>
          <p className="about-v2-section-lead">{ABOUT_VALUES_SECTION.description}</p>
        </TimelineContent>

        <TimelineContent animationNum={1} timelineRef={sectionRef}>
          <div className="about-v2-values-board">
            {ABOUT_VALUES.map((value, index) => (
              <article key={value.label} className="about-v2-values-item">
                <span className="about-v2-values-bg-word" aria-hidden>
                  {value.label}
                </span>
                <span className="about-v2-values-index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{value.label}</h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
