"use client";

import { useRef } from "react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { ABOUT_VALUES } from "@/data/about";
import { cn } from "@/lib/utils";

export function AboutMissionVision() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="missao-visao"
      ref={sectionRef}
      className="about-values scroll-mt-[var(--header-height)]"
    >
      <div className="about-values-bg" aria-hidden />
      <div className="container-page relative">
        <div className="about-values-header">
          <TimelineContent animationNum={0} timelineRef={sectionRef}>
            <p className="about-eyebrow">Missão, visão e propósito</p>
          </TimelineContent>
          <h2 className="about-section-heading about-section-heading--center about-section-heading--light">
            <VerticalCutReveal delay={0.02}>
              Compromisso com empresas e com a saúde ocupacional
            </VerticalCutReveal>
          </h2>
        </div>

        <div className="about-values-grid">
          {ABOUT_VALUES.map((value, index) => {
            const Icon = value.icon;
            return (
              <TimelineContent
                key={value.title}
                animationNum={index + 1}
                timelineRef={sectionRef}
                className={cn(
                  "about-values-card",
                  value.variant === "featured" && "about-values-card--featured"
                )}
              >
                <div className="about-values-card-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <h3 className="about-values-card-title">{value.title}</h3>
                <p className="about-values-card-text">{value.text}</p>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
