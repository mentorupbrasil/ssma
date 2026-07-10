import { AboutBrandFrame } from "@/components/public/about/AboutBrandFrame";
import { SectionHeader } from "@/components/public/SectionHeader";
import { ABOUT_STRUCTURE, ABOUT_STRUCTURE_GALLERY } from "@/data/about";

const GALLERY_VARIANTS = {
  primary: "gallery-primary",
  "secondary-a": "gallery-a",
  "secondary-b": "gallery-b",
} as const;

export function AboutStructure() {
  const [primary, ...secondary] = ABOUT_STRUCTURE_GALLERY;

  return (
    <section id="nossa-estrutura" className="about-structure scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionHeader
          eyebrow={ABOUT_STRUCTURE.eyebrow}
          title={ABOUT_STRUCTURE.title}
          description={ABOUT_STRUCTURE.description}
        />

        <div className="about-gallery">
          <div className="about-gallery-feature">
            <div className="about-gallery-frame">
              <AboutBrandFrame
                image={primary.image}
                alt={primary.alt}
                variant={GALLERY_VARIANTS[primary.variant]}
              />
              <div className="about-gallery-overlay">
                <h3>{primary.title}</h3>
                <p>{primary.description}</p>
              </div>
            </div>
          </div>

          <div className="about-gallery-stack">
            {secondary.map((frame) => (
              <div key={frame.title} className="about-gallery-frame">
                <AboutBrandFrame
                  image={frame.image}
                  alt={frame.alt}
                  variant={GALLERY_VARIANTS[frame.variant]}
                />
                <div className="about-gallery-overlay">
                  <h3>{frame.title}</h3>
                  <p>{frame.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="about-structure-note">
          <p className="home-section-eyebrow">{ABOUT_STRUCTURE.editorial.title}</p>
          <p className="about-structure-note-text">{ABOUT_STRUCTURE.editorial.description}</p>
        </aside>
      </div>
    </section>
  );
}
