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

            <TimelineContent animationNum={2} timelineRef={sectionRef}>
              <blockquote className="about-ed-history-quote">
                <p>{ABOUT_HISTORY.quote}</p>
              </blockquote>
            </TimelineContent>
          </div>

          <TimelineContent animationNum={3} timelineRef={sectionRef}>
            <div className="about-ed-history-aside">
              <p className="about-ed-history-aside-label">Destaques</p>
              <ul className="about-ed-history-highlights" aria-label="Destaques institucionais">
                {ABOUT_HISTORY_HIGHLIGHTS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label} className="about-ed-history-highlight">
                      <span className="about-ed-history-highlight-num" aria-hidden>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="about-ed-history-highlight-icon" aria-hidden>
                        <Icon strokeWidth={1.75} />
                      </span>
                      <span className="about-ed-history-highlight-text">{item.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
