import { ArrowRight, Phone } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { ABOUT_FINAL_CTA } from "@/data/about";

type AboutFinalCTAProps = {
  whatsappHref: string;
};

export function AboutFinalCTA({ whatsappHref }: AboutFinalCTAProps) {
  return (
    <section className="about-ed-cta scroll-mt-[var(--header-height)]" aria-labelledby="about-final-cta-title">
      <div className="container-page about-ed-page">
        <div className="about-ed-cta-panel">
          <div className="about-ed-cta-glow" aria-hidden />
          <div className="about-ed-cta-grid">
            <div className="about-ed-cta-copy">
              <h2 id="about-final-cta-title" className="about-ed-cta-title">
                {ABOUT_FINAL_CTA.title}
              </h2>
              <p className="about-ed-cta-desc">{ABOUT_FINAL_CTA.description}</p>
            </div>
            <div className="about-ed-cta-actions">
              <AboutCtaLink href="/contato?tipo=orcamento" variant="brand" size="lg">
                {ABOUT_FINAL_CTA.primaryCta}
                <ArrowRight className="size-4" aria-hidden />
              </AboutCtaLink>
              <AboutCtaLink href={whatsappHref} variant="outline-light" size="lg" external>
                {ABOUT_FINAL_CTA.secondaryCta}
                <Phone className="size-4" aria-hidden />
              </AboutCtaLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
