"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CalendarHeart,
  ClipboardList,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { cn } from "@/lib/utils";

type BannerCta = {
  label: string;
  variant: "primary" | "secondary";
  href?: string;
  whatsappMessage?: string;
  icon: "calendar" | "clipboard" | "message";
};

type BannerHighlight = {
  kind: "banner";
  id: string;
  label: string;
  image: string;
  alt: string;
  ctas: [BannerCta, BannerCta];
};

type CardHighlight = {
  kind: "card";
  id: string;
  label: string;
  tag: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "emerald" | "sky" | "amber";
  href?: string;
  ctaLabel?: string;
};

type Highlight = CardHighlight | BannerHighlight;

const BANNER_HIGHLIGHTS = [
  {
    kind: "banner" as const,
    id: "toxicologico",
    label: "Exame Toxicológico",
    image: "/images/hero/highlights/toxicologico.png",
    alt: "Exame Toxicológico UniMetra — agilidade, segurança e atendimento especializado para motoristas e empresas.",
    ctas: [
      {
        label: "Agendar exame",
        variant: "primary" as const,
        href: "/encaminhamento-online",
        icon: "calendar" as const,
      },
      {
        label: "Fale com a Unimetra",
        variant: "secondary" as const,
        whatsappMessage: "Olá! Gostaria de agendar um exame toxicológico na Unimetra.",
        icon: "message" as const,
      },
    ],
  },
  {
    kind: "banner" as const,
    id: "concurso",
    label: "Pacotes para concursos",
    image: "/images/hero/highlights/concurso-publico.png",
    alt: "Pacotes de exames para concursos públicos — agilidade e orientação especializada para candidatos aprovados.",
    ctas: [
      {
        label: "Solicitar pacote",
        variant: "primary" as const,
        href: "/contato?tipo=orcamento",
        icon: "clipboard" as const,
      },
      {
        label: "Fale com a Unimetra",
        variant: "secondary" as const,
        whatsappMessage:
          "Olá! Gostaria de solicitar o pacote de exames para concurso público na Unimetra.",
        icon: "message" as const,
      },
    ],
  },
] satisfies BannerHighlight[];

const CARD_HIGHLIGHTS = [
  {
    kind: "card" as const,
    id: "julho",
    label: "Julho · Prevenção",
    tag: "Julho · Prevenção",
    title: "Cuidado com a saúde no inverno",
    description:
      "Campanha de orientação em SST e exames preventivos para equipes — mais prevenção e conformidade no segundo semestre.",
    icon: CalendarHeart,
    tone: "sky" as const,
    href: "/servicos",
    ctaLabel: "Conhecer serviços",
  },
] satisfies CardHighlight[];

const TONE_CLASS = {
  emerald: "home-hero-highlight-card--emerald",
  sky: "home-hero-highlight-card--sky",
  amber: "home-hero-highlight-card--amber",
} as const;

const CTA_ICONS = {
  calendar: Calendar,
  clipboard: ClipboardList,
  message: MessageCircle,
} as const;

function BannerCtaButton({ cta }: { cta: BannerCta }) {
  const clinic = getClinicInfo();
  const Icon = CTA_ICONS[cta.icon];
  const className = cn(
    "home-hero-highlight-btn",
    cta.variant === "primary"
      ? "home-hero-highlight-btn--primary"
      : "home-hero-highlight-btn--secondary"
  );

  if (cta.whatsappMessage) {
    const href = whatsappLink(cta.whatsappMessage.replace("Unimetra", clinic.name));

    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {cta.label}
      </a>
    );
  }

  return (
    <Link href={cta.href ?? "/contato"} className={className}>
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      {cta.label}
    </Link>
  );
}

function BannerSlide({
  item,
  isActive,
  priority,
}: {
  item: BannerHighlight;
  isActive: boolean;
  priority?: boolean;
}) {
  return (
    <article
      className={cn(
        "home-hero-highlight-banner",
        isActive && "home-hero-highlight-banner--active"
      )}
      aria-hidden={!isActive}
    >
      <div className="home-hero-highlight-banner-media">
        <Image
          src={item.image}
          alt={item.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 520px"
          className="home-hero-highlight-banner-image"
          priority={priority}
        />
      </div>

      <div className="home-hero-highlight-banner-actions">
        {item.ctas.map((cta) => (
          <BannerCtaButton key={`${item.id}-${cta.label}`} cta={cta} />
        ))}
      </div>
    </article>
  );
}

function CardSlide({ item, isActive }: { item: CardHighlight; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <article
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
}

export function HomeHeroHighlights() {
  const [activeIndex, setActiveIndex] = useState(0);

  const highlights = useMemo<Highlight[]>(
    () => [...BANNER_HIGHLIGHTS, ...CARD_HIGHLIGHTS],
    []
  );

  const hasBanner = highlights.some((item) => item.kind === "banner");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % highlights.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [highlights.length]);

  return (
    <div className="home-hero-highlights" aria-label="Novidades e destaques">
      <div
        className={cn(
          "home-hero-highlights-frame",
          hasBanner && "home-hero-highlights-frame--banner"
        )}
      >
        <p className="home-hero-highlights-kicker">Novidades</p>

        <div
          className={cn(
            "home-hero-highlights-stage",
            hasBanner && "home-hero-highlights-stage--banner"
          )}
        >
          {highlights.map((item, index) => {
            const isActive = index === activeIndex;

            if (item.kind === "banner") {
              return (
                <BannerSlide
                  key={item.id}
                  item={item}
                  isActive={isActive}
                  priority={index === 0}
                />
              );
            }

            return <CardSlide key={item.id} item={item} isActive={isActive} />;
          })}
        </div>

        <div className="home-hero-highlights-dots" role="tablist" aria-label="Destaques">
          {highlights.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={item.label}
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
        {highlights.map((item) => (
          <li key={item.id}>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
