import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type AboutCTAProps = {
  whatsappHref: string;
};

export function AboutCTA({ whatsappHref }: AboutCTAProps) {
  return (
    <section className="about-ed-cta scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <div className="about-ed-cta-panel">
          <h2 className="about-ed-cta-title">
            Conheça uma forma mais organizada de cuidar da saúde ocupacional da sua empresa
          </h2>

          <p className="about-ed-cta-desc">
            Fale com um especialista e veja como a Unimetra pode apoiar sua empresa com exames,
            documentos, encaminhamentos e rotinas de SST.
          </p>

          <div className="about-ed-cta-actions">
            <Link href="/contato?tipo=orcamento">
              <Button variant="brand" size="lg" className="rounded-xl">
                Solicitar orçamento
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <Button variant="outline-light" size="lg" className="rounded-xl">
                Falar com especialista
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
