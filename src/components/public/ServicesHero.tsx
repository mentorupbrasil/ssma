"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SERVICES_HERO_BADGES } from "@/data/services";

type ServicesHeroProps = {
  whatsappHref: string;
};

export function ServicesHero({ whatsappHref }: ServicesHeroProps) {
  return (
    <section className="services-hero scroll-mt-[var(--header-height)]">
      <div className="services-hero-bg" aria-hidden />
      <div className="container-page services-hero-inner">
        <p className="services-hero-eyebrow">Portfólio completo</p>
        <h1 className="services-hero-title">
          Soluções completas em Saúde e Segurança do Trabalho para empresas
        </h1>
        <p className="services-hero-desc">
          Exames ocupacionais, programas, laudos, documentação e suporte ao RH para manter sua
          empresa em conformidade com mais organização.
        </p>

        <div className="services-hero-badges" aria-label="Áreas de atuação">
          {SERVICES_HERO_BADGES.map((badge) => (
            <span key={badge} className="services-hero-badge">
              {badge}
            </span>
          ))}
        </div>

        <div className="services-hero-actions">
          <Link href="/contato?tipo=orcamento">
            <Button variant="brand" size="lg" className="rounded-xl">
              Solicitar orçamento
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="rounded-xl border-slate-200 bg-white/80">
              Falar com especialista
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
