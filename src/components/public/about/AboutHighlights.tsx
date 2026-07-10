import { ABOUT_HIGHLIGHTS } from "@/data/about";

export function AboutHighlights() {
  return (
    <section className="about-highlights" aria-label="Destaques da Unimetra">
      <div className="container-page">
        <ul className="about-highlights-grid">
          {ABOUT_HIGHLIGHTS.map((item) => (
            <li key={item.label} className="about-highlights-item">
              <span className="about-highlights-value">{item.value}</span>
              <span className="about-highlights-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
