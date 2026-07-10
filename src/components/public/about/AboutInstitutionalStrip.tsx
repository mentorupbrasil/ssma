import { ABOUT_PILLARS } from "@/data/about";

export function AboutInstitutionalStrip() {
  return (
    <div className="about-ed-strip">
      <div className="container-page about-ed-page">
        <ul className="about-ed-strip-list" aria-label="Pilares institucionais da Unimetra">
          {ABOUT_PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label} className="about-ed-strip-item">
                <span className="about-ed-strip-icon" aria-hidden>
                  <Icon strokeWidth={1.75} />
                </span>
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
