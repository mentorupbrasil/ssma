import { ABOUT_INSTITUTIONAL_STATS } from "@/data/about";

export function AboutStatsSection() {
  return (
    <section className="about-stats" aria-label="Indicadores institucionais">
      <div className="container-page">
        <div className="about-stats-grid">
          {ABOUT_INSTITUTIONAL_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={`${stat.value}-${stat.label}`} className="about-stats-card">
                <div className="about-stats-card-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <p className="about-stats-card-value">{stat.value}</p>
                <p className="about-stats-card-label">{stat.label}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
