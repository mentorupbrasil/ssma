"use client";

import { useRef } from "react";

import { SectionHeader } from "@/components/public/SectionHeader";
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
      <div className="container-page about-ed-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow="Missão, visão e propósito"
            title="O que nos orienta"
            description="Diretrizes que orientam o atendimento e a organização da Unimetra."
            className="about-ed-section-header"
          />
        </TimelineContent>

        <div className="about-ed-mission-cards">
          {ABOUT_VALUES.map((value, index) => {
            const Icon = value.icon;
            return (
              <TimelineContent
                key={value.title}
                animationNum={index + 1}
                timelineRef={sectionRef}
                className="about-ed-mission-card"
              >
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
