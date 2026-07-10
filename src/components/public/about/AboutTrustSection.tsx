import { ABOUT_TRUST, ABOUT_TRUST_PILLARS } from "@/data/about";

export function AboutTrustSection() {
  return (
    <section id="confianca" className="about-trust home-why scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <div className="home-why-panel about-trust-panel">
          <div className="home-why-header">
            <p className="home-why-eyebrow">{ABOUT_TRUST.eyebrow}</p>
            <h2 className="home-why-title">{ABOUT_TRUST.title}</h2>
            <p className="home-why-desc">{ABOUT_TRUST.description}</p>
          </div>

          <div className="about-trust-pillars">
            {ABOUT_TRUST_PILLARS.map((pillar, index) => (
              <article key={pillar.title} className="about-trust-pillar">
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
