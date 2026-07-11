import { EditorialHero } from "@/components/public/EditorialHero";
import { BLOG_HERO_BADGES } from "@/data/blog-page";

type BlogHeroProps = {
  whatsappHref: string;
};

export function BlogHero({ whatsappHref }: BlogHeroProps) {
  return (
    <EditorialHero
      ctaPill={{ href: whatsappHref, label: "Falar com especialista", external: true }}
      title="Blog de Saúde e Segurança do Trabalho"
      description="Artigos, orientações e atualizações para empresas, gestores e equipes de RH manterem a rotina ocupacional organizada e em conformidade."
      badges={BLOG_HERO_BADGES}
      badgesAriaLabel="Temas do blog"
    />
  );
}
