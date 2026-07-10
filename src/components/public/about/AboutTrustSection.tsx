import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ABOUT_TRUST, ABOUT_TRUST_PILLARS } from "@/data/about";

export function AboutTrustSection() {
  return (
    <section id="confianca" className="about-trust scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <div className="about-trust-panel">
          <div className="about-trust-header">
            <p className="about-trust-eyebrow">{ABOUT_TRUST.eyebrow}</p>
            <h2 className="about-trust-title">{ABOUT_TRUST.title}</h2>
            <p className="about-trust-desc">{ABOUT_TRUST.description}</p>
          </div>

          <div className="about-trust-pillars">
            {ABOUT_TRUST_PILLARS.map((pillar, index) => (
              <article key={pillar.title} className="about-trust-pillar">
                <GlowingEffect
                  spread={34}
                  glow
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
                <span className="about-trust-pillar-num" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
