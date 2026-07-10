import { ABOUT_INSTITUTIONAL_STRIP } from "@/data/about";

export function AboutInstitutionalStrip() {
  return (
    <div className="about-ed-strip">
      <div className="container-page about-ed-page">
        <ul className="about-ed-strip-list" aria-label="Áreas de atuação da clínica">
          {ABOUT_INSTITUTIONAL_STRIP.map((item) => {
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
