import { ArrowRight, BookOpen } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { EditorialHero } from "@/components/public/EditorialHero";
import { BLOG_HERO_BADGES } from "@/data/blog-page";

type BlogHeroProps = {
  whatsappHref: string;
};

export function BlogHero({ whatsappHref }: BlogHeroProps) {
  return (
    <EditorialHero
      pill={{ href: "#artigos", label: "Conteúdo em SST" }}
      title="Blog de Saúde e Segurança do Trabalho"
      description="Artigos, orientações e atualizações para empresas, gestores e equipes de RH manterem a rotina ocupacional organizada e em conformidade."
      badges={BLOG_HERO_BADGES}
      badgesAriaLabel="Temas do blog"
      actions={
        <>
          <AboutCtaLink
            href="#artigos"
            variant="brand"
            size="default"
            className="about-v2-hero-cta about-v2-hero-cta-primary group"
          >
            <BookOpen className="size-4" aria-hidden />
            Ver artigos
          </AboutCtaLink>
          <AboutCtaLink
            href={whatsappHref}
            variant="outline"
            size="default"
            external
            className="about-v2-hero-cta about-v2-hero-cta-secondary group"
          >
            Falar com especialista
          </AboutCtaLink>
        </>
      }
    />
  );
}
