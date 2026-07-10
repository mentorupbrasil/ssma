"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_DELIVERABLES, ABOUT_SCOPE } from "@/data/about";

type DeliverableFeatureProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

function DeliverableFeature({ title, description, icon: Icon }: DeliverableFeatureProps) {
  return (
    <article className="about-ed-deliver-card group/deliver">
      <div className="about-ed-deliver-card-icon" aria-hidden>
        <Icon strokeWidth={1.75} />
      </div>
      <h3 className="about-ed-deliver-card-title">{title}</h3>
      <p className="about-ed-deliver-card-desc">{description}</p>
    </article>
  );
}

export function AboutDeliverables() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="nossa-atuacao"
      ref={sectionRef}
      className="about-ed-deliver scroll-mt-[var(--header-height)]"
    >
      <div className="container-page about-ed-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow={ABOUT_SCOPE.eyebrow}
            title={ABOUT_SCOPE.title}
            description={ABOUT_SCOPE.description}
            className="about-ed-section-header"
          />
        </TimelineContent>

        <TimelineContent animationNum={1} timelineRef={sectionRef}>
          <div className="about-ed-deliver-grid">
            {ABOUT_DELIVERABLES.map((item) => (
              <DeliverableFeature
                key={item.title}
                title={item.title}
                description={item.text}
                icon={item.icon}
              />
            ))}
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
