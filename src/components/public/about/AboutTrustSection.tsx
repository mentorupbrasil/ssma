"use client";

import { useRef } from "react";
import { Check } from "lucide-react";

import { SectionHeader } from "@/components/public/SectionHeader";
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
        <div className="about-ed-trust-layout">
          <TimelineContent animationNum={0} timelineRef={sectionRef}>
            <SectionHeader
              eyebrow={ABOUT_TRUST.eyebrow}
              title={ABOUT_TRUST.title}
              description={ABOUT_TRUST.description}
              className="about-ed-section-header"
            />
          </TimelineContent>

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
