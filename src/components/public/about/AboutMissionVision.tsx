"use client";

import { useRef } from "react";

import { MissionFeatureVisual } from "@/components/public/about/AboutMissionVisuals";
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
        <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-ed-mission-intro">
          <p className="about-ed-label">Missão, visão e propósito</p>
          <p className="about-ed-mission-intro-text">
            Diretrizes que orientam o atendimento e a organização da Unimetra
          </p>
        </TimelineContent>

        <div className="about-ed-mission-cards">
          {ABOUT_VALUES.map((value, index) => (
            <TimelineContent
              key={value.title}
              animationNum={index + 1}
              timelineRef={sectionRef}
              className="about-ed-mission-feature"
            >
              <div className="about-ed-mission-feature-visual">
                <MissionFeatureVisual type={value.visual} icon={value.icon} />
              </div>
              <div className="about-ed-mission-feature-body">
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            </TimelineContent>
          ))}
        </div>
      </div>
    </section>
  );
}
