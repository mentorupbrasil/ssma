import Link from "next/link";
import { ArrowRight, Building2, FileCheck, Monitor, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ABOUT_HERO_STATS } from "@/data/about";

type AboutHeroProps = {
  clinicName: string;
  whatsappHref: string;
};

const HIGHLIGHT_ICONS = [Building2, FileCheck, Monitor, ShieldCheck] as const;

export function AboutHero({ clinicName, whatsappHref }: AboutHeroProps) {
  return (
    <section className="about-hero scroll-mt-[var(--header-height)]">
      <div className="about-hero-bg" aria-hidden />
      <div className="container-page about-hero-inner">
        <div className="about-hero-grid">
          <div className="about-hero-copy">
            <p className="about-hero-eyebrow">Institucional</p>
            <h1 className="about-hero-title">
              Saúde ocupacional com estrutura, tecnologia e confiança para empresas
            </h1>
            <p className="about-hero-desc">
              A {clinicName} apoia empresas na organização de exames, documentos ocupacionais e
              rotinas de SST com atendimento presencial e recursos digitais para o RH.
            </p>

            <div className="about-hero-actions">
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

            <dl className="about-hero-stats">
              {ABOUT_HERO_STATS.map((stat) => (
                <div key={stat.label} className="about-hero-stat">
                  <dt className="about-hero-stat-value">{stat.value}</dt>
                  <dd className="about-hero-stat-label">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="about-hero-aside" aria-label="Destaques institucionais">
            <div className="hero-aside-panel">
              <p className="hero-aside-panel-kicker">Por que empresas confiam</p>
              <ul className="hero-aside-panel-list">
                {ABOUT_HERO_STATS.map((stat, index) => {
                  const Icon = HIGHLIGHT_ICONS[index] ?? Building2;
                  return (
                    <li key={stat.label} className="hero-aside-panel-item">
                      <span className="hero-aside-panel-icon" aria-hidden>
                        <Icon strokeWidth={1.75} />
                      </span>
                      <span>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
