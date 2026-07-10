"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_HISTORY } from "@/data/about";

export function AboutHistory() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="nossa-historia" ref={sectionRef} className="about-v2-history scroll-mt-[var(--header-height)]">
      <div className="container-page about-v2-container">
        <div className="about-v2-history-layout">
          <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-v2-history-rail">
            <p className="about-v2-eyebrow about-v2-eyebrow--dark">{ABOUT_HISTORY.eyebrow}</p>
            <h2 className="about-v2-section-title about-v2-history-title">{ABOUT_HISTORY.title}</h2>
          </TimelineContent>

          <div className="about-v2-history-main">
            <TimelineContent animationNum={1} timelineRef={sectionRef} className="about-v2-history-prose">
              {ABOUT_HISTORY.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </TimelineContent>

            <TimelineContent animationNum={2} timelineRef={sectionRef}>
              <blockquote className="about-v2-history-quote">
                <p>{ABOUT_HISTORY.highlightQuote}</p>
              </blockquote>
            </TimelineContent>

            <TimelineContent animationNum={3} timelineRef={sectionRef}>
              <ul className="about-v2-history-facts" aria-label="Destaques institucionais">
                {ABOUT_HISTORY.highlights.map((item, index) => (
                  <li key={item}>
                    <span className="about-v2-history-fact-index" aria-hidden>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </TimelineContent>
          </div>
        </div>
      </div>
    </section>
  );
}
