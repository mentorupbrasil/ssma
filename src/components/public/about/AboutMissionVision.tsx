import { SectionHeader } from "@/components/public/SectionHeader";
import { ABOUT_VALUES, ABOUT_VALUES_SECTION } from "@/data/about";

export function AboutMissionVision() {
  return (
    <section id="proposito-missao-visao" className="about-values scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionHeader
          eyebrow={ABOUT_VALUES_SECTION.eyebrow}
          title={ABOUT_VALUES_SECTION.title}
          description={ABOUT_VALUES_SECTION.description}
          align="center"
        />

        <div className="about-values-grid">
          {ABOUT_VALUES.map((value, index) => (
            <article key={value.label} className="about-values-card">
              <span className="about-values-num" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{value.label}</h3>
              <p>{value.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
