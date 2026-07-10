import { Compass, Eye, Target, type LucideIcon } from "lucide-react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { ABOUT_VALUES, ABOUT_VALUES_SECTION } from "@/data/about";

const VALUE_ICONS: LucideIcon[] = [Target, Compass, Eye];

export function AboutMissionVision() {
  return (
    <section id="proposito-missao-visao" className="about-values scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionHeader
          eyebrow={ABOUT_VALUES_SECTION.eyebrow}
          title={ABOUT_VALUES_SECTION.title}
          description={ABOUT_VALUES_SECTION.description}
          align="center"
        />

        <div className="about-values-grid">
          {ABOUT_VALUES.map((value, index) => {
            const Icon = VALUE_ICONS[index] ?? Target;
            return (
              <article key={value.label} className="about-values-card">
                <div className="about-values-card-top">
                  <span className="about-values-icon" aria-hidden>
                    <Icon strokeWidth={1.7} />
                  </span>
                  <span className="about-values-num" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3>{value.label}</h3>
                <p>{value.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
