"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_VALUES } from "@/data/about";

export function AboutMissionVision() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="missao-visao"
      ref={sectionRef}
      className="about-ed-mission scroll-mt-[var(--header-height)]"
    >
      <div className="container-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-ed-mission-header">
          <p className="about-ed-label">Missão, visão e propósito</p>
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
                <div className="about-ed-mission-icon" aria-hidden>
                  <Icon strokeWidth={1.75} />
                </div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
