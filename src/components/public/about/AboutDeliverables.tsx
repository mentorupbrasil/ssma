"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_DELIVERABLES } from "@/data/about";

export function AboutDeliverables() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="about-ed-deliver scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <div className="about-ed-deliver-header">
          <TimelineContent animationNum={0} timelineRef={sectionRef}>
            <p className="about-ed-label">O que entregamos</p>
          </TimelineContent>
          <TimelineContent animationNum={1} timelineRef={sectionRef}>
            <h2 className="about-ed-heading">O que a Unimetra entrega para empresas</h2>
          </TimelineContent>
        </div>

        <div className="about-ed-deliver-grid">
          {ABOUT_DELIVERABLES.map((item, index) => {
            const Icon = item.icon;
            return (
              <TimelineContent
                key={item.title}
                animationNum={index + 2}
                timelineRef={sectionRef}
                className="about-ed-deliver-card"
              >
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
