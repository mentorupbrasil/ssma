"use client";

import { useRef } from "react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_VALUES, ABOUT_VALUES_SECTION } from "@/data/about";

export function AboutMissionVision() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="proposito-missao-visao"
      ref={sectionRef}
      className="about-ed-mission scroll-mt-[var(--header-height)]"
    >
      <div className="container-page about-ed-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow={ABOUT_VALUES_SECTION.eyebrow}
            title={ABOUT_VALUES_SECTION.title}
            description={ABOUT_VALUES_SECTION.description}
            className="about-ed-section-header about-ed-section-header--center"
          />
        </TimelineContent>

        <div className="about-ed-mission-grid">
          {ABOUT_VALUES.map((value, index) => {
            const Icon = value.icon;
            return (
              <TimelineContent
                key={value.title}
                animationNum={index + 1}
                timelineRef={sectionRef}
                className="about-ed-mission-card"
              >
                <span className="about-ed-mission-card-num" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="about-ed-mission-card-icon" aria-hidden>
                  <Icon strokeWidth={1.75} />
                </span>
                <div className="about-ed-mission-card-body">
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </div>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
