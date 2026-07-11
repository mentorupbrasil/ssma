import { EditorialHero } from "@/components/public/EditorialHero";
import { ABOUT_HERO, ABOUT_HERO_STRIP } from "@/data/about";

export function AboutHero() {
  return (
    <EditorialHero
      ctaPill={{ href: "/servicos", label: "Conhecer nossos serviços" }}
      title={ABOUT_HERO.title}
      description={ABOUT_HERO.description}
      badges={ABOUT_HERO_STRIP}
      badgesAriaLabel="Áreas de atuação"
    />
  );
}
