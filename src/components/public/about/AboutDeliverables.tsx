"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_DELIVERABLES, ABOUT_SCOPE } from "@/data/about";

export function AboutDeliverables() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="nossa-atuacao" ref={sectionRef} className="about-v2-scope scroll-mt-[var(--header-height)]">
      <div className="container-page about-v2-container">
        <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-v2-section-intro">
          <p className="about-v2-eyebrow about-v2-eyebrow--dark">{ABOUT_SCOPE.eyebrow}</p>
          <h2 className="about-v2-section-title">{ABOUT_SCOPE.title}</h2>
          <p className="about-v2-section-lead">{ABOUT_SCOPE.description}</p>
        </TimelineContent>

        <TimelineContent animationNum={1} timelineRef={sectionRef}>
          <div className="about-v2-bento">
            {ABOUT_DELIVERABLES.map((item) => (
              <article key={item.title} className={`about-v2-bento-card about-v2-bento-card--${item.layout}`}>
                <span className="about-v2-bento-marker" aria-hidden />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
