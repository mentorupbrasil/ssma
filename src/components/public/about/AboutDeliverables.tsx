"use client";

import { useRef } from "react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_DELIVERABLES, ABOUT_SCOPE } from "@/data/about";

export function AboutDeliverables() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="nossa-atuacao"
      ref={sectionRef}
      className="about-ed-deliver scroll-mt-[var(--header-height)]"
    >
      <div className="container-page about-ed-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow={ABOUT_SCOPE.eyebrow}
            title={ABOUT_SCOPE.title}
            description={ABOUT_SCOPE.description}
            className="about-ed-section-header"
          />
        </TimelineContent>

        <TimelineContent animationNum={1} timelineRef={sectionRef}>
          <ul className="about-ed-scope-list">
            {ABOUT_DELIVERABLES.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="about-ed-scope-item">
                  <span className="about-ed-scope-index" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="about-ed-scope-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                  <div className="about-ed-scope-body">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </TimelineContent>
      </div>
    </section>
  );
}
