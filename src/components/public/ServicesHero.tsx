import { EditorialHero } from "@/components/public/EditorialHero";
import { EDITORIAL_HERO_CONTENT } from "@/data/editorial-hero";

const content = EDITORIAL_HERO_CONTENT.servicos;

type ServicesHeroProps = {
  whatsappHref: string;
};

export function ServicesHero({ whatsappHref }: ServicesHeroProps) {
  return (
    <EditorialHero
      ctaPill={{ href: whatsappHref, label: content.ctaLabel, external: true }}
      titleLines={content.titleLines}
      descriptionLines={content.descriptionLines}
    />
  );
}
