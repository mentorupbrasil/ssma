"use client";

import { useRef } from "react";

import { AboutBrandFrame } from "@/components/public/about/AboutBrandFrame";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_STRUCTURE, ABOUT_STRUCTURE_GALLERY } from "@/data/about";

const GALLERY_VARIANTS = {
  primary: "gallery-primary",
  "secondary-a": "gallery-a",
  "secondary-b": "gallery-b",
} as const;

export function AboutStructure() {
  const sectionRef = useRef<HTMLElement>(null);
  const [primary, ...secondary] = ABOUT_STRUCTURE_GALLERY;

  return (
    <section id="nossa-estrutura" ref={sectionRef} className="about-v2-structure scroll-mt-[var(--header-height)]">
      <div className="container-page about-v2-container">
        <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-v2-sec-head">
          <span className="about-v2-sec-index" aria-hidden>
            03
          </span>
          <div className="about-v2-sec-head-copy">
            <p className="about-v2-eyebrow about-v2-eyebrow--dark">{ABOUT_STRUCTURE.eyebrow}</p>
            <h2 className="about-v2-section-title">{ABOUT_STRUCTURE.title}</h2>
            <p className="about-v2-section-lead about-v2-section-lead--inline">{ABOUT_STRUCTURE.description}</p>
          </div>
        </TimelineContent>

        <div className="about-v2-gallery-mosaic">
          <TimelineContent animationNum={1} timelineRef={sectionRef} className="about-v2-gallery-feature">
            <div className="about-v2-gallery-frame">
              <AboutBrandFrame
                image={primary.image}
                alt={primary.alt}
                variant={GALLERY_VARIANTS[primary.variant]}
              />
              <div className="about-v2-gallery-overlay">
                <h3>{primary.title}</h3>
                <p>{primary.description}</p>
              </div>
            </div>
          </TimelineContent>

          <div className="about-v2-gallery-stack">
            {secondary.map((frame, index) => (
              <TimelineContent
                key={frame.title}
                animationNum={index + 2}
                timelineRef={sectionRef}
                className="about-v2-gallery-stack-item"
              >
                <div className="about-v2-gallery-frame">
                  <AboutBrandFrame
                    image={frame.image}
                    alt={frame.alt}
                    variant={GALLERY_VARIANTS[frame.variant]}
                  />
                  <div className="about-v2-gallery-overlay">
                    <h3>{frame.title}</h3>
                    <p>{frame.description}</p>
                  </div>
                </div>
              </TimelineContent>
            ))}
          </div>
        </div>

        <TimelineContent animationNum={4} timelineRef={sectionRef} className="about-v2-structure-note">
          <div className="about-v2-structure-note-inner">
            <p className="about-v2-structure-note-label">Complemento</p>
            <h3>{ABOUT_STRUCTURE.editorial.title}</h3>
            <p>{ABOUT_STRUCTURE.editorial.description}</p>
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
