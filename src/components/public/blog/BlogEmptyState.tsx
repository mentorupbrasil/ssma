import { BookOpen } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";

export function BlogEmptyState() {
  return (
    <div className="blog-empty">
      <div className="blog-empty-icon" aria-hidden>
        <BookOpen className="size-7" strokeWidth={1.5} />
      </div>
      <h2 className="blog-empty-title">Nenhum artigo publicado ainda</h2>
      <p className="blog-empty-desc">
        Em breve você encontrará aqui conteúdos sobre SST, conformidade legal, exames ocupacionais
        e orientações para o dia a dia do RH.
      </p>
      <AboutCtaLink href="/contato" variant="outline" size="default" className="rounded-xl">
        Fale conosco
      </AboutCtaLink>
    </div>
  );
}
