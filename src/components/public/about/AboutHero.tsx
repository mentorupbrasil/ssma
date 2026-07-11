import { EditorialHero } from "@/components/public/EditorialHero";
import { EDITORIAL_HERO_CONTENT } from "@/data/editorial-hero";

const content = EDITORIAL_HERO_CONTENT.sobre;

export function AboutHero() {
  return (
    <EditorialHero
      ctaPill={{ href: "/servicos", label: content.ctaLabel }}
      titleLines={content.titleLines}
      descriptionLines={content.descriptionLines}
    />
  );
}
