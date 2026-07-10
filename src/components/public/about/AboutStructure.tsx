"use client";

import { useRef } from "react";

import { AboutMediaFallback } from "@/components/public/about/AboutMediaFallback";
import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_STRUCTURE, ABOUT_STRUCTURE_ITEMS } from "@/data/about";

export function AboutStructure() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="nossa-estrutura"
      ref={sectionRef}
      className="about-ed-structure scroll-mt-[var(--header-height)]"
    >
      <div className="container-page about-ed-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow={ABOUT_STRUCTURE.eyebrow}
            title={ABOUT_STRUCTURE.title}
            description={ABOUT_STRUCTURE.description}
            className="about-ed-section-header"
          />
        </TimelineContent>

        <div className="about-ed-structure-grid">
          {ABOUT_STRUCTURE_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <TimelineContent
                key={item.title}
                animationNum={index + 1}
                timelineRef={sectionRef}
                className="about-ed-structure-item"
              >
                {item.image ? (
                  <AboutMediaFallback
                    icon={Icon}
                    image={item.image}
                    alt={item.title}
                    variant="structure"
                    className="about-ed-structure-item-photo"
                  />
                ) : (
                  <span className="about-ed-structure-item-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                )}
                <div className="about-ed-structure-item-body">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
