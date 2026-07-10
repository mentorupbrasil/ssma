"use client";

import { useRef } from "react";
import { Check } from "lucide-react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_TRUST, ABOUT_TRUST_CHECKLIST } from "@/data/about";

export function AboutTrustSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="confianca"
      ref={sectionRef}
      className="about-ed-trust scroll-mt-[var(--header-height)]"
    >
      <div className="container-page about-ed-page">
        <div className="about-ed-trust-panel">
          <div className="about-ed-trust-glow" aria-hidden />
          <div className="about-ed-trust-copy">
            <TimelineContent animationNum={0} timelineRef={sectionRef}>
              <p className="about-ed-trust-eyebrow">{ABOUT_TRUST.eyebrow}</p>
              <h2 className="about-ed-trust-title">{ABOUT_TRUST.title}</h2>
              <p className="about-ed-trust-desc">{ABOUT_TRUST.description}</p>
            </TimelineContent>
          </div>

          <TimelineContent animationNum={1} timelineRef={sectionRef}>
            <ul className="about-ed-trust-list" aria-label="Compromissos institucionais">
              {ABOUT_TRUST_CHECKLIST.map((item) => (
                <li key={item}>
                  <Check className="about-ed-trust-check" strokeWidth={2.25} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
