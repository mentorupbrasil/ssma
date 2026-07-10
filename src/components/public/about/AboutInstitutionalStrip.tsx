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
                <Icon className="about-ed-strip-icon" strokeWidth={1.75} aria-hidden />
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
