"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_HISTORY } from "@/data/about";

export function AboutHistory() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="nossa-historia" ref={sectionRef} className="about-v2-history scroll-mt-[var(--header-height)]">
      <div className="container-page about-v2-container">
        <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-v2-sec-head">
          <span className="about-v2-sec-index" aria-hidden>
            01
          </span>
          <div className="about-v2-sec-head-copy">
            <p className="about-v2-eyebrow about-v2-eyebrow--dark">{ABOUT_HISTORY.eyebrow}</p>
            <h2 className="about-v2-section-title">{ABOUT_HISTORY.title}</h2>
          </div>
        </TimelineContent>

        <TimelineContent animationNum={1} timelineRef={sectionRef} className="about-v2-history-prose">
          {ABOUT_HISTORY.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </TimelineContent>

        <TimelineContent animationNum={2} timelineRef={sectionRef}>
          <figure className="about-v2-history-pull">
            <blockquote>
              <p>{ABOUT_HISTORY.highlightQuote}</p>
            </blockquote>
          </figure>
        </TimelineContent>

        <TimelineContent animationNum={3} timelineRef={sectionRef}>
          <div className="about-v2-history-strip" role="list" aria-label="Destaques institucionais">
            {ABOUT_HISTORY.highlights.map((item) => (
              <div key={item} className="about-v2-history-strip-item" role="listitem">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
