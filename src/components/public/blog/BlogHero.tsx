import { ArrowRight, BookOpen } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { BLOG_HERO_BADGES } from "@/data/blog-page";

type BlogHeroProps = {
  whatsappHref: string;
};

export function BlogHero({ whatsappHref }: BlogHeroProps) {
  return (
    <section className="blog-hero scroll-mt-[var(--header-height)]">
      <div className="blog-hero-bg" aria-hidden />
      <div className="container-page blog-hero-inner">
        <div className="blog-hero-content animate-fade-up">
          <a href="#artigos" className="blog-hero-pill">
            <span>Conteúdo em SST</span>
            <span className="blog-hero-pill-divider" aria-hidden />
            <span className="blog-hero-pill-icon" aria-hidden>
              <ArrowRight className="size-3" />
            </span>
          </a>

          <h1 className="blog-hero-title">Blog de Saúde e Segurança do Trabalho</h1>
          <p className="blog-hero-desc">
            Artigos, orientações e atualizações para empresas, gestores e equipes de RH manterem a
            rotina ocupacional organizada e em conformidade.
          </p>

          <div className="blog-hero-badges" aria-label="Temas do blog">
            {BLOG_HERO_BADGES.map((badge) => (
              <span key={badge} className="blog-hero-badge">
                {badge}
              </span>
            ))}
          </div>

          <div className="blog-hero-actions">
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
          </div>
        </div>
      </div>
    </section>
  );
}
