import { EditorialHero } from "@/components/public/EditorialHero";
import { EDITORIAL_HERO_CONTENT } from "@/data/editorial-hero";

const content = EDITORIAL_HERO_CONTENT.blog;

type BlogHeroProps = {
  whatsappHref: string;
};

export function BlogHero({ whatsappHref }: BlogHeroProps) {
  return (
    <EditorialHero
      ctaPill={{ href: whatsappHref, label: content.ctaLabel, external: true }}
      titleLines={content.titleLines}
      descriptionLines={content.descriptionLines}
    />
  );
}
