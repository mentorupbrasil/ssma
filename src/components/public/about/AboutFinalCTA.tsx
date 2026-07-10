import { ArrowRight, Phone } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { ABOUT_FINAL_CTA } from "@/data/about";

type AboutFinalCTAProps = {
  whatsappHref: string;
};

export function AboutFinalCTA({ whatsappHref }: AboutFinalCTAProps) {
  return (
    <section className="about-v2-cta scroll-mt-[var(--header-height)]" aria-labelledby="about-final-cta-title">
      <div className="container-page about-v2-container">
        <div className="about-v2-cta-panel">
          <div className="about-v2-cta-copy">
            <h2 id="about-final-cta-title" className="about-v2-cta-title">
              {ABOUT_FINAL_CTA.title}
            </h2>
            <p className="about-v2-cta-desc">{ABOUT_FINAL_CTA.description}</p>
          </div>
          <div className="about-v2-cta-actions">
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
    </section>
  );
}
