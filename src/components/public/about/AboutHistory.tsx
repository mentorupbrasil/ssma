"use client";

import { useRef } from "react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_HISTORY, ABOUT_HISTORY_HIGHLIGHTS } from "@/data/about";

export function AboutHistory() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="nossa-historia"
      ref={sectionRef}
      className="about-ed-history scroll-mt-[var(--header-height)]"
    >
      <div className="container-page about-ed-page">
        <div className="about-ed-history-grid">
          <div className="about-ed-history-copy">
            <TimelineContent animationNum={0} timelineRef={sectionRef}>
              <SectionHeader
                eyebrow={ABOUT_HISTORY.eyebrow}
                title={ABOUT_HISTORY.title}
                className="about-ed-section-header"
              />
            </TimelineContent>

            <TimelineContent animationNum={1} timelineRef={sectionRef} className="about-ed-prose">
              {ABOUT_HISTORY.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </TimelineContent>
          </div>

          <TimelineContent animationNum={2} timelineRef={sectionRef}>
            <ul className="about-ed-history-highlights" aria-label="Destaques institucionais">
              {ABOUT_HISTORY_HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label} className="about-ed-history-highlight">
                    <span className="about-ed-history-highlight-icon" aria-hidden>
                      <Icon strokeWidth={1.75} />
                    </span>
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
