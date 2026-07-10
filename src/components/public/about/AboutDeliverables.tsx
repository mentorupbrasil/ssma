"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_DELIVERABLES } from "@/data/about";

type DeliverableFeatureProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
  total: number;
};

function DeliverableFeature({ title, description, icon: Icon, index, total }: DeliverableFeatureProps) {
  const isTopRow = index < Math.ceil(total / 2);

  return (
    <div className="about-ed-deliver-feature group/feature">
      <div
        className={`about-ed-deliver-feature-glow ${isTopRow ? "about-ed-deliver-feature-glow--top" : "about-ed-deliver-feature-glow--bottom"}`}
        aria-hidden
      />

      <div className="about-ed-deliver-feature-icon" aria-hidden>
        <Icon strokeWidth={1.75} />
      </div>

      <div className="about-ed-deliver-feature-title-wrap">
        <div className="about-ed-deliver-feature-accent" aria-hidden />
        <h3 className="about-ed-deliver-feature-title">{title}</h3>
      </div>

      <p className="about-ed-deliver-feature-desc">{description}</p>
    </div>
  );
}

export function AboutDeliverables() {
  const sectionRef = useRef<HTMLElement>(null);
  const total = ABOUT_DELIVERABLES.length;

  return (
    <section ref={sectionRef} className="about-ed-deliver scroll-mt-[var(--header-height)]">
      <div className="container-page about-ed-page">
        <TimelineContent animationNum={0} timelineRef={sectionRef}>
          <SectionHeader
            eyebrow="O que entregamos"
            title="O que a Unimetra entrega para empresas"
            className="about-ed-section-header"
          />
        </TimelineContent>

        <TimelineContent animationNum={1} timelineRef={sectionRef}>
          <div className="about-ed-deliver-features">
            {ABOUT_DELIVERABLES.map((item, index) => (
              <DeliverableFeature
                key={item.title}
                title={item.title}
                description={item.text}
                icon={item.icon}
                index={index}
                total={total}
              />
            ))}
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
