import { ArrowRight, Phone } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { EditorialHero } from "@/components/public/EditorialHero";
import { ABOUT_HERO, ABOUT_HERO_STRIP } from "@/data/about";
import { whatsappLink } from "@/lib/helpers";

type AboutHeroProps = {
  clinicName: string;
};

export function AboutHero({ clinicName }: AboutHeroProps) {
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com um especialista da ${clinicName}.`
  );

  return (
    <EditorialHero
      pill={{ href: "#nossa-historia", label: ABOUT_HERO.eyebrow }}
      title={ABOUT_HERO.title}
      description={ABOUT_HERO.description}
      badges={ABOUT_HERO_STRIP}
      badgesAriaLabel="Áreas de atuação"
      actions={
        <>
          <AboutCtaLink
            href={whatsappHref}
            variant="brand"
            size="default"
            external
            className="about-v2-hero-cta about-v2-hero-cta-primary group"
          >
            <Phone className="size-4" aria-hidden />
            {ABOUT_HERO.primaryCta}
          </AboutCtaLink>
          <AboutCtaLink
            href="/servicos"
            variant="outline"
            size="default"
            className="about-v2-hero-cta about-v2-hero-cta-secondary group"
          >
            {ABOUT_HERO.secondaryCta}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </AboutCtaLink>
        </>
      }
    />
  );
}
