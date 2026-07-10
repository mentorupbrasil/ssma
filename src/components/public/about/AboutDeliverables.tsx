"use client";

import { useRef } from "react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_DELIVERABLES } from "@/data/about";

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

        <div className="about-ed-deliver-grid">
          {ABOUT_DELIVERABLES.map((item, index) => {
            const Icon = item.icon;
            return (
              <TimelineContent
                key={item.title}
                animationNum={index + 1}
                timelineRef={sectionRef}
                className="about-ed-deliver-card"
              >
                <span className="about-ed-deliver-index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
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
