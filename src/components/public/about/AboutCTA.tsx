import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ABOUT_CTA_TAGS } from "@/data/about";

type AboutCTAProps = {
  whatsappHref: string;
};

export function AboutCTA({ whatsappHref }: AboutCTAProps) {
  return (
    <section className="about-cta scroll-mt-[var(--header-height)]">
      <div className="about-cta-glow" aria-hidden />
      <div className="container-page relative">
        <div className="about-cta-tags">
          {ABOUT_CTA_TAGS.map((tag) => (
            <span key={tag} className="about-cta-tag">
              {tag}
            </span>
          ))}
        </div>

        <h2 className="about-cta-title">
          Conheça uma forma mais organizada de cuidar da saúde ocupacional da sua empresa
        </h2>

        <p className="about-cta-desc">
          Fale com um especialista e veja como a Unimetra pode apoiar sua empresa com exames,
          documentos, encaminhamentos e rotinas de SST.
        </p>

        <div className="about-cta-actions">
          <Link href="/contato?tipo=orcamento">
            <Button variant="brand" size="lg" className="about-cta-btn rounded-xl">
              Solicitar orçamento
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <Button variant="outline-light" size="lg" className="about-cta-btn rounded-xl">
              Falar com especialista
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
