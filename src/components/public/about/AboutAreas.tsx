import { Check } from "lucide-react";
import { ABOUT_EXPERTISE } from "@/data/about";

export function AboutAreas() {
  return (
    <section
      id="areas-atuacao"
      className="about-areas scroll-mt-[var(--header-height)]"
    >
      <div className="container-page">
        <div className="about-areas-header">
          <p className="about-eyebrow about-eyebrow--muted">Áreas de atuação</p>
          <h2 className="about-section-heading">
            Medicina, Segurança e gestão ocupacional integradas
          </h2>
          <p className="about-section-lead">
            Atuação completa para apoiar empresas em exames, programas, laudos e rotinas digitais de
            SST.
          </p>
        </div>

        <div className="about-areas-grid">
          {ABOUT_EXPERTISE.map((area) => {
            const Icon = area.icon;
            return (
              <article key={area.title} className="about-areas-card">
                <div className="about-areas-card-head">
                  <div className="about-areas-card-icon">
                    <Icon strokeWidth={1.75} />
                  </div>
                  <h3 className="about-areas-card-title">{area.title}</h3>
                </div>
                <p className="about-areas-card-desc">{area.text}</p>
                <ul className="about-areas-card-list">
                  {area.items.map((item) => (
                    <li key={item}>
                      <Check className="about-areas-card-check" strokeWidth={2.5} aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
