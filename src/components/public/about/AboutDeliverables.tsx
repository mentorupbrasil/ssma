import { AboutScopeBento } from "@/components/public/about/AboutScopeBento";
import { SectionHeader } from "@/components/public/SectionHeader";
import { ABOUT_DELIVERABLES, ABOUT_SCOPE } from "@/data/about";

export function AboutDeliverables() {
  return (
    <section id="nossa-atuacao" className="about-scope home-clinical scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionHeader
          eyebrow={ABOUT_SCOPE.eyebrow}
          title={ABOUT_SCOPE.title}
          description={ABOUT_SCOPE.description}
        />
        <AboutScopeBento items={ABOUT_DELIVERABLES} />
      </div>
    </section>
  );
}
