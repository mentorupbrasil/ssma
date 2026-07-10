import { MapPin, Monitor, Users } from "lucide-react";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ABOUT_HISTORY } from "@/data/about";

const HIGHLIGHT_ICONS = [MapPin, Users, Monitor] as const;

export function AboutHistory() {
  return (
    <section id="nossa-historia" className="about-history scroll-mt-[var(--header-height)]">
      <div className="about-history-bg" aria-hidden>
        <div className="about-history-bg-glow" />
      </div>

      <div className="container-page about-history-container">
        <div className="about-history-grid">
          <header className="about-history-intro">
            <p className="about-history-eyebrow">{ABOUT_HISTORY.eyebrow}</p>
            <h2 className="about-history-title">{ABOUT_HISTORY.title}</h2>
            <p className="about-history-intro-location">
              <MapPin className="size-3.5" strokeWidth={2} aria-hidden />
              Imperatriz — MA
            </p>
          </header>

          <div className="about-history-main">
            <div className="about-history-prose">
              {ABOUT_HISTORY.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="about-history-text">
                  {paragraph}
                </p>
              ))}
            </div>

            <figure className="about-history-pull">
              <GlowingEffect
                spread={34}
                glow
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <span className="about-history-pull-mark" aria-hidden>
                “
              </span>
              <blockquote>
                <p>{ABOUT_HISTORY.highlightQuote}</p>
              </blockquote>
            </figure>

            <ul className="about-history-facts" aria-label="Destaques institucionais">
              {ABOUT_HISTORY.highlights.map((item, index) => {
                const Icon = HIGHLIGHT_ICONS[index] ?? MapPin;
                return (
                  <li key={item} className="about-history-fact">
                    <span className="about-history-fact-icon" aria-hidden>
                      <Icon strokeWidth={1.85} />
                    </span>
                    <span className="about-history-fact-label">{item}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
