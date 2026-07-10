"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CalendarHeart,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Highlight = {
  id: string;
  tag: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "emerald" | "sky" | "amber";
  href?: string;
  ctaLabel?: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    id: "toxicologico",
    tag: "Exame em destaque",
    title: "Toxicológico",
    description:
      "Coleta orientada e laudo para CNH, funções regulamentadas e exigências de toxicológico no PCMSO.",
    icon: FlaskConical,
    tone: "emerald",
    href: "/exames",
    ctaLabel: "Ver toxicológico",
  },
  {
    id: "julho",
    tag: "Julho · Prevenção",
    title: "Cuidado com a saúde no inverno",
    description:
      "Campanha de orientação em SST e exames preventivos para equipes — mais prevenção e conformidade no segundo semestre.",
    icon: CalendarHeart,
    tone: "sky",
    href: "/servicos",
    ctaLabel: "Conhecer serviços",
  },
  {
    id: "concurso",
    tag: "Pacote especial",
    title: "Exames para concurso público",
    description:
      "Aprovou na etapa documental? Realize aqui todos os exames do edital em um único fluxo, com orientação de preparo.",
    icon: Briefcase,
    tone: "amber",
    href: "/exames#preparo-por-exame",
    ctaLabel: "Ver preparos",
  },
];

const TONE_CLASS = {
  emerald: "home-hero-highlight-card--emerald",
  sky: "home-hero-highlight-card--sky",
  amber: "home-hero-highlight-card--amber",
} as const;

export function HomeHeroHighlights() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HIGHLIGHTS.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const active = HIGHLIGHTS[activeIndex];

  return (
    <div className="home-hero-highlights" aria-label="Novidades e destaques">
      <div className="home-hero-highlights-frame">
        <p className="home-hero-highlights-kicker">Novidades</p>

        <div className="home-hero-highlights-stage">
          {HIGHLIGHTS.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;

            return (
              <article
                key={item.id}
                className={cn(
                  "home-hero-highlight-card",
                  TONE_CLASS[item.tone],
                  isActive && "home-hero-highlight-card--active"
                )}
                aria-hidden={!isActive}
              >
                <div className="home-hero-highlight-card-accent" aria-hidden />
                <div className="home-hero-highlight-card-top">
                  <span className="home-hero-highlight-card-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                  <span className="home-hero-highlight-card-tag">{item.tag}</span>
                </div>
                <p className="home-hero-highlight-card-title">{item.title}</p>
                <p className="home-hero-highlight-card-desc">{item.description}</p>
                {item.href && item.ctaLabel ? (
                  <Link href={item.href} className="home-hero-highlight-card-link group">
                    {item.ctaLabel}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="home-hero-highlights-dots" role="tablist" aria-label="Destaques">
          {HIGHLIGHTS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={item.title}
              className={cn(
                "home-hero-highlights-dot",
                index === activeIndex && "home-hero-highlights-dot--active"
              )}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>

      <ul className="home-hero-highlights-mini" aria-label="Resumo dos destaques">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              <span>{item.title}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
