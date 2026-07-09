import { ABOUT_VALUES } from "@/data/about";
import { cn } from "@/lib/utils";

export function AboutMissionVision() {
  return (
    <section
      id="missao-visao"
      className="about-values scroll-mt-[var(--header-height)]"
    >
      <div className="about-values-bg" aria-hidden />
      <div className="container-page relative">
        <div className="about-values-header">
          <p className="about-eyebrow">Missão, visão e propósito</p>
          <h2 className="about-section-heading about-section-heading--center about-section-heading--light">
            Compromisso com empresas e com a saúde ocupacional
          </h2>
        </div>

        <div className="about-values-grid">
          {ABOUT_VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <article
                key={value.title}
                className={cn(
                  "about-values-card",
                  value.variant === "featured" && "about-values-card--featured"
                )}
              >
                <div className="about-values-card-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <h3 className="about-values-card-title">{value.title}</h3>
                <p className="about-values-card-text">{value.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
