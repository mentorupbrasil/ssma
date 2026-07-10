import { Armchair, ListChecks, ShieldCheck, type LucideIcon } from "lucide-react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ABOUT_STRUCTURE, ABOUT_STRUCTURE_GALLERY } from "@/data/about";
import { cn } from "@/lib/utils";

const STRUCTURE_ICONS: Record<string, LucideIcon> = {
  primary: Armchair,
  "secondary-a": ListChecks,
  "secondary-b": ShieldCheck,
};

export function AboutStructure() {
  const [primary, ...secondary] = ABOUT_STRUCTURE_GALLERY;
  const PrimaryIcon = STRUCTURE_ICONS[primary.variant] ?? Armchair;

  return (
    <section id="nossa-estrutura" className="about-structure scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionHeader
          eyebrow={ABOUT_STRUCTURE.eyebrow}
          title={ABOUT_STRUCTURE.title}
          description={ABOUT_STRUCTURE.description}
        />

        <div className="about-structure-grid">
          <article className="about-structure-card about-structure-card--featured">
            <GlowingEffect
              spread={40}
              glow
              disabled={false}
              proximity={72}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <span className="about-structure-pulse" aria-hidden>
              <svg viewBox="0 0 320 60" fill="none" preserveAspectRatio="none">
                <path
                  className="about-structure-pulse-base"
                  d="M0 34H70L92 12L116 52L142 24L166 34H210L230 20L252 44L276 30H320"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  className="about-structure-pulse-beat"
                  d="M0 34H70L92 12L116 52L142 24L166 34H210L230 20L252 44L276 30H320"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={100}
                />
              </svg>
            </span>

            <div className="about-structure-card-top">
              <span className="about-structure-card-icon" aria-hidden>
                <PrimaryIcon strokeWidth={1.75} />
              </span>
              <span className="about-structure-card-index" aria-hidden>
                01
              </span>
            </div>

            <div className="about-structure-card-body">
              <h3 className="about-structure-card-title">{primary.title}</h3>
              <p className="about-structure-card-desc">{primary.description}</p>
            </div>
          </article>

          <div className="about-structure-stack">
            {secondary.map((frame, index) => {
              const Icon = STRUCTURE_ICONS[frame.variant] ?? ListChecks;
              return (
                <article
                  key={frame.title}
                  className={cn("about-structure-card", "about-structure-card--light")}
                >
                  <span className="about-structure-card-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                  <div className="about-structure-card-body">
                    <div className="about-structure-card-head">
                      <h3 className="about-structure-card-title">{frame.title}</h3>
                      <span className="about-structure-card-index" aria-hidden>
                        {String(index + 2).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="about-structure-card-desc">{frame.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="about-structure-note">
          <p className="home-section-eyebrow">{ABOUT_STRUCTURE.editorial.title}</p>
          <p className="about-structure-note-text">{ABOUT_STRUCTURE.editorial.description}</p>
        </aside>
      </div>
    </section>
  );
}
