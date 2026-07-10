import { MapPin, Monitor, Users } from "lucide-react";

import { SectionHeader } from "@/components/public/SectionHeader";
import { ABOUT_HISTORY } from "@/data/about";

const HIGHLIGHT_ICONS = [MapPin, Users, Monitor] as const;

export function AboutHistory() {
  return (
    <section id="nossa-historia" className="about-history scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionHeader
          eyebrow={ABOUT_HISTORY.eyebrow}
          title={ABOUT_HISTORY.title}
        />

        <div className="about-history-body">
          {ABOUT_HISTORY.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="about-history-text">
              {paragraph}
            </p>
          ))}
        </div>

        <figure className="about-history-quote">
          <blockquote>
            <p>{ABOUT_HISTORY.highlightQuote}</p>
          </blockquote>
        </figure>

        <div className="about-history-strip" role="list" aria-label="Destaques institucionais">
          {ABOUT_HISTORY.highlights.map((item, index) => {
            const Icon = HIGHLIGHT_ICONS[index] ?? MapPin;
            return (
              <div key={item} className="about-history-strip-card" role="listitem">
                <span className="about-history-strip-icon" aria-hidden>
                  <Icon strokeWidth={2} />
                </span>
                <h3>{item}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
