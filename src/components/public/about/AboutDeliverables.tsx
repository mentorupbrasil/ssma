"use client";

import { useRef } from "react";

import { AboutGridPattern } from "@/components/public/about/AboutGridPattern";
import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_DELIVERABLES } from "@/data/about";

const DELIVERABLE_PATTERNS: number[][][] = [
  [[7, 1], [8, 3], [9, 2]],
  [[6, 2], [7, 4], [10, 1]],
  [[8, 1], [9, 3], [10, 5]],
  [[7, 2], [8, 5], [9, 1]],
];

export function AboutDeliverables() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="about-ed-deliver scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow="O que entregamos"
            title="O que a Unimetra entrega para empresas"
            className="about-ed-section-header"
          />
        </TimelineContent>

        <div className="about-ed-deliver-bento">
          {ABOUT_DELIVERABLES.map((item, index) => {
            const Icon = item.icon;
            return (
              <TimelineContent
                key={item.title}
                animationNum={index + 1}
                timelineRef={sectionRef}
                className="about-ed-deliver-card"
              >
                <div className="about-ed-deliver-pattern" aria-hidden>
                  <AboutGridPattern squares={DELIVERABLE_PATTERNS[index]} />
                </div>
                <div className="about-ed-deliver-icon" aria-hidden>
                  <Icon strokeWidth={1.75} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
