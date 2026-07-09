"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_INSTITUTIONAL_STATS } from "@/data/about";

export function AboutStatsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="about-stats" aria-label="Indicadores institucionais">
      <div className="container-page">
        <div className="about-stats-grid">
          {ABOUT_INSTITUTIONAL_STATS.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <TimelineContent
                key={stat.label}
                animationNum={index}
                timelineRef={sectionRef}
                className="about-stats-card"
              >
                <div className="about-stats-card-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <p className="about-stats-card-value">{stat.value}</p>
                <p className="about-stats-card-label">{stat.label}</p>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
