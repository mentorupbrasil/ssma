"use client";

import { useRef } from "react";

import { AboutGridPattern } from "@/components/public/about/AboutGridPattern";
import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_VALUES } from "@/data/about";
import { cn } from "@/lib/utils";

export function AboutMissionVision() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="missao-visao"
      ref={sectionRef}
      className="about-ed-mission scroll-mt-[var(--header-height)]"
    >
      <div className="container-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow="Missão, visão e propósito"
            title="O que nos orienta"
            className="about-ed-section-header about-ed-mission-header"
          />
        </TimelineContent>

        <div className="about-ed-mission-grid">
          {ABOUT_VALUES.map((value, index) => {
            const Icon = value.icon;
            const isFeatured = value.variant === "featured";
            return (
              <TimelineContent
                key={value.title}
                animationNum={index + 1}
                timelineRef={sectionRef}
                className={cn(
                  "about-ed-mission-card",
                  isFeatured && "about-ed-mission-card--featured"
                )}
              >
                {isFeatured && (
                  <div className="about-ed-mission-pattern" aria-hidden>
                    <AboutGridPattern squares={[[5, 1], [6, 3], [7, 2]]} />
                  </div>
                )}
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
