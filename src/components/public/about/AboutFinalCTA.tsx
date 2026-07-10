import { CTASection } from "@/components/public/CTASection";
import { ABOUT_FINAL_CTA } from "@/data/about";

type AboutFinalCTAProps = {
  whatsappHref: string;
};

export function AboutFinalCTA({ whatsappHref }: AboutFinalCTAProps) {
  return (
    <CTASection
      className="about-final-cta"
      title={ABOUT_FINAL_CTA.title}
      description={ABOUT_FINAL_CTA.description}
      primaryLabel={ABOUT_FINAL_CTA.primaryCta}
      primaryHref="/contato?tipo=orcamento"
      secondaryLabel={ABOUT_FINAL_CTA.secondaryCta}
      secondaryHref={whatsappHref}
    />
  );
}
