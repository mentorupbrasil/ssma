"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_TRUST, ABOUT_TRUST_PILLARS } from "@/data/about";

export function AboutTrustSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="confianca" ref={sectionRef} className="about-v2-trust scroll-mt-[var(--header-height)]">
      <div className="about-v2-trust-band">
        <div className="container-page about-v2-container">
          <div className="about-v2-trust-layout">
            <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-v2-trust-intro">
              <span className="about-v2-sec-index about-v2-sec-index--light" aria-hidden>
                06
              </span>
              <p className="about-v2-eyebrow">{ABOUT_TRUST.eyebrow}</p>
              <h2 className="about-v2-trust-title">{ABOUT_TRUST.title}</h2>
              <p className="about-v2-trust-lead">{ABOUT_TRUST.description}</p>
            </TimelineContent>

            <div className="about-v2-trust-pillars">
              {ABOUT_TRUST_PILLARS.map((pillar, index) => (
                <TimelineContent
                  key={pillar.title}
                  animationNum={index + 1}
                  timelineRef={sectionRef}
                  className="about-v2-trust-pillar"
                >
                  <span className="about-v2-trust-pillar-num" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </TimelineContent>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
