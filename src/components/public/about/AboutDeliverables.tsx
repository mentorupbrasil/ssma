"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_DELIVERABLES, ABOUT_SCOPE } from "@/data/about";

const BENTO_TAGS: Record<string, string> = {
  featured: "Principal",
  tall: "SST",
  medium: "Documentos",
  wide: "Digital",
};

export function AboutDeliverables() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="nossa-atuacao" ref={sectionRef} className="about-v2-scope scroll-mt-[var(--header-height)]">
      <div className="container-page about-v2-container">
        <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-v2-sec-head about-v2-sec-head--split">
          <div className="about-v2-sec-head-main">
            <span className="about-v2-sec-index" aria-hidden>
              02
            </span>
            <div className="about-v2-sec-head-copy">
              <p className="about-v2-eyebrow about-v2-eyebrow--dark">{ABOUT_SCOPE.eyebrow}</p>
              <h2 className="about-v2-section-title">{ABOUT_SCOPE.title}</h2>
            </div>
          </div>
          <p className="about-v2-sec-head-aside">{ABOUT_SCOPE.description}</p>
        </TimelineContent>

        <TimelineContent animationNum={1} timelineRef={sectionRef}>
          <div className="about-v2-bento">
            {ABOUT_DELIVERABLES.map((item) => (
              <article key={item.title} className={`about-v2-bento-card about-v2-bento-card--${item.layout}`}>
                <div className="about-v2-bento-card-top">
                  <span className="about-v2-bento-tag">{BENTO_TAGS[item.layout]}</span>
                  <span className="about-v2-bento-line" aria-hidden />
                </div>
                <div className="about-v2-bento-card-body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
