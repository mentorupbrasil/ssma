import Link from "next/link";
import { ArrowRight, ClipboardList, Layers, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SERVICE_CATEGORIES, SERVICES_HERO_BADGES } from "@/data/services";

type ServicesHeroProps = {
  whatsappHref: string;
};

const SERVICE_COUNT = SERVICE_CATEGORIES.reduce(
  (total, category) => total + category.services.length,
  0
);

const HERO_STATS = [
  { value: String(SERVICE_CATEGORIES.length), label: "categorias de serviço" },
  { value: `${SERVICE_COUNT}+`, label: "soluções para SST" },
  { value: "100%", label: "foco em conformidade legal" },
] as const;

export function ServicesHero({ whatsappHref }: ServicesHeroProps) {
  return (
    <section className="services-hero scroll-mt-[var(--header-height)]">
      <div className="services-hero-bg" aria-hidden />
      <div className="container-page services-hero-inner">
        <div className="services-hero-layout">
          <div className="services-hero-copy">
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
                <Button variant="outline-light" size="lg" className="rounded-xl">
                  Falar com especialista
                </Button>
              </a>
            </div>
          </div>

          <aside className="services-hero-aside" aria-label="Resumo do portfólio">
            <div className="hero-aside-panel">
              <p className="hero-aside-panel-kicker">Portfólio Unimetra</p>
              <dl className="hero-aside-panel-stats">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className="hero-aside-panel-stat">
                    <dt className="hero-aside-panel-stat-value">{stat.value}</dt>
                    <dd className="hero-aside-panel-stat-label">{stat.label}</dd>
                  </div>
                ))}
              </dl>
              <ul className="hero-aside-panel-list">
                {SERVICE_CATEGORIES.map((category) => (
                  <li key={category.id} className="hero-aside-panel-item">
                    <span className="hero-aside-panel-icon" aria-hidden>
                      {category.id === "medicina-ocupacional" && <ClipboardList strokeWidth={1.75} />}
                      {category.id === "seguranca-trabalho" && <ShieldCheck strokeWidth={1.75} />}
                      {category.id === "exames-complementares" && <Layers strokeWidth={1.75} />}
                      {category.id === "documentacao" && <ClipboardList strokeWidth={1.75} />}
                    </span>
                    <span>
                      <strong>{category.title}</strong>
                      <span>{category.services.length} serviços</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
