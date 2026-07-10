"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  Calendar,
  CalendarHeart,
  ClipboardList,
  Clock,
  FileCheck,
  FlaskConical,
  Headphones,
  MessageCircle,
  ShieldCheck,
  Snowflake,
  TestTube2,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { cn } from "@/lib/utils";

type SlideCta = {
  label: string;
  variant: "primary" | "secondary";
  href?: string;
  whatsappMessage?: string;
  icon: LucideIcon;
};

type EditorialSlide = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  tone: "emerald" | "sky" | "amber";
  features: { icon: LucideIcon; label: string }[];
  ctas: [SlideCta, SlideCta];
  visual: "toxicologico" | "concurso" | "julho";
};

const SLIDES: EditorialSlide[] = [
  {
    id: "toxicologico",
    label: "Exame Toxicológico",
    eyebrow: "Serviço em destaque",
    title: "Exame",
    titleAccent: "Toxicológico",
    description:
      "Coleta orientada e laudo para CNH, funções regulamentadas e exigências do PCMSO.",
    tone: "emerald",
    features: [
      { icon: Clock, label: "Atendimento ágil" },
      { icon: ShieldCheck, label: "Resultado confiável" },
      { icon: Headphones, label: "Suporte especializado" },
    ],
    ctas: [
      {
        label: "Agendar exame",
        variant: "primary",
        href: "/encaminhamento-online",
        icon: Calendar,
      },
      {
        label: "Fale com a Unimetra",
        variant: "secondary",
        whatsappMessage: "Olá! Gostaria de agendar um exame toxicológico na Unimetra.",
        icon: MessageCircle,
      },
    ],
    visual: "toxicologico",
  },
  {
    id: "concurso",
    label: "Pacotes para concursos",
    eyebrow: "Solução em destaque",
    title: "Pacotes de exames",
    titleAccent: "para concursos",
    description:
      "Passou na prova? Realize os exames do edital com orientação de preparo e fluxo organizado.",
    tone: "amber",
    features: [
      { icon: FileCheck, label: "Pacotes exclusivos" },
      { icon: Clock, label: "Atendimento rápido" },
      { icon: Headphones, label: "Suporte completo" },
    ],
    ctas: [
      {
        label: "Solicitar pacote",
        variant: "primary",
        href: "/contato?tipo=orcamento",
        icon: ClipboardList,
      },
      {
        label: "Fale com a Unimetra",
        variant: "secondary",
        whatsappMessage:
          "Olá! Gostaria de solicitar o pacote de exames para concurso público na Unimetra.",
        icon: MessageCircle,
      },
    ],
    visual: "concurso",
  },
  {
    id: "julho",
    label: "Julho · Prevenção",
    eyebrow: "Campanha do mês",
    title: "Prevenção em",
    titleAccent: "SST no inverno",
    description:
      "Orientação para equipes sobre exames preventivos, riscos sazonais e rotinas de conformidade.",
    tone: "sky",
    features: [
      { icon: Snowflake, label: "Riscos sazonais" },
      { icon: CalendarHeart, label: "Exames preventivos" },
      { icon: Briefcase, label: "Apoio ao RH" },
    ],
    ctas: [
      {
        label: "Conhecer serviços",
        variant: "primary",
        href: "/servicos",
        icon: FileCheck,
      },
      {
        label: "Fale com a Unimetra",
        variant: "secondary",
        whatsappMessage: "Olá! Gostaria de saber mais sobre a campanha de prevenção em SST.",
        icon: MessageCircle,
      },
    ],
    visual: "julho",
  },
];

const TONE_CLASS = {
  emerald: "home-hero-editorial--emerald",
  sky: "home-hero-editorial--sky",
  amber: "home-hero-editorial--amber",
} as const;

function SlideCtaButton({ cta }: { cta: SlideCta }) {
  const clinic = getClinicInfo();
  const Icon = cta.icon;
  const className = cn(
    "home-hero-editorial-btn",
    cta.variant === "primary"
      ? "home-hero-editorial-btn--primary"
      : "home-hero-editorial-btn--secondary"
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

function ToxicologicoVisual() {
  return (
    <div className="home-hero-editorial-visual-panel">
      <div className="home-hero-editorial-visual-card home-hero-editorial-visual-card--main">
        <span className="home-hero-editorial-visual-icon" aria-hidden>
          <FlaskConical strokeWidth={1.75} />
        </span>
        <div>
          <p className="home-hero-editorial-visual-title">Coleta toxicológica</p>
          <p className="home-hero-editorial-visual-sub">Laudo para CNH e PCMSO</p>
        </div>
        <span className="home-hero-editorial-visual-badge home-hero-editorial-visual-badge--ok">
          Disponível
        </span>
      </div>
      <div className="home-hero-editorial-visual-row">
        <div className="home-hero-editorial-visual-chip">
          <TestTube2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          <span>Coleta orientada</span>
        </div>
        <div className="home-hero-editorial-visual-chip">
          <Truck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          <span>Motoristas</span>
        </div>
      </div>
      <div className="home-hero-editorial-visual-foot">
        <BadgeCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        <span>Conforme exigências legais</span>
      </div>
    </div>
  );
}

function ConcursoVisual() {
  const steps = [
    { label: "Edital", status: "Conferido" },
    { label: "Exames", status: "Em andamento" },
    { label: "Apto", status: "Próximo passo" },
  ] as const;

  return (
    <div className="home-hero-editorial-visual-panel">
      <p className="home-hero-editorial-visual-kicker">Fluxo do candidato</p>
      <ol className="home-hero-editorial-visual-steps">
        {steps.map((step, index) => (
          <li key={step.label} className="home-hero-editorial-visual-step">
            <span className="home-hero-editorial-visual-step-num">{index + 1}</span>
            <div>
              <p className="home-hero-editorial-visual-step-label">{step.label}</p>
              <p className="home-hero-editorial-visual-step-status">{step.status}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="home-hero-editorial-visual-quote">
        <p>Avaliação · Apto · Pronto para sua posse</p>
      </div>
    </div>
  );
}

function JulhoVisual() {
  return (
    <div className="home-hero-editorial-visual-panel">
      <div className="home-hero-editorial-visual-stats">
        <div className="home-hero-editorial-visual-stat">
          <span className="home-hero-editorial-visual-stat-value">Jul</span>
          <span className="home-hero-editorial-visual-stat-label">Campanha ativa</span>
        </div>
        <div className="home-hero-editorial-visual-stat">
          <span className="home-hero-editorial-visual-stat-value">SST</span>
          <span className="home-hero-editorial-visual-stat-label">Prevenção</span>
        </div>
      </div>
      <div className="home-hero-editorial-visual-card home-hero-editorial-visual-card--soft">
        <Snowflake className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <div>
          <p className="home-hero-editorial-visual-title">Saúde no inverno</p>
          <p className="home-hero-editorial-visual-sub">
            Orientação para equipes e exames preventivos
          </p>
        </div>
      </div>
      <div className="home-hero-editorial-visual-foot">
        <CalendarHeart className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        <span>Apoio contínuo ao RH</span>
      </div>
    </div>
  );
}

const VISUALS = {
  toxicologico: ToxicologicoVisual,
  concurso: ConcursoVisual,
  julho: JulhoVisual,
} as const;

function EditorialSlideCard({
  slide,
  isActive,
}: {
  slide: EditorialSlide;
  isActive: boolean;
}) {
  const Visual = VISUALS[slide.visual];

  return (
    <article
      className={cn(
        "home-hero-editorial",
        TONE_CLASS[slide.tone],
        isActive && "home-hero-editorial--active"
      )}
      aria-hidden={!isActive}
    >
      <div className="home-hero-editorial-copy">
        <p className="home-hero-editorial-eyebrow">{slide.eyebrow}</p>
        <h2 className="home-hero-editorial-title">
          {slide.title}{" "}
          <span className="home-hero-editorial-title-accent">{slide.titleAccent}</span>
        </h2>
        <p className="home-hero-editorial-desc">{slide.description}</p>

        <ul className="home-hero-editorial-features">
          {slide.features.map((feature) => {
            const Icon = feature.icon;
            return (
              <li key={feature.label}>
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span>{feature.label}</span>
              </li>
            );
          })}
        </ul>

        <div className="home-hero-editorial-actions">
          {slide.ctas.map((cta) => (
            <SlideCtaButton key={cta.label} cta={cta} />
          ))}
        </div>
      </div>

      <div className="home-hero-editorial-aside" aria-hidden>
        <Visual />
      </div>
    </article>
  );
}

export function HomeHeroHighlights() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="home-hero-highlights" aria-label="Novidades e destaques">
      <div className="home-hero-highlights-frame home-hero-highlights-frame--editorial">
        <p className="home-hero-highlights-kicker">Novidades</p>

        <div className="home-hero-highlights-stage home-hero-highlights-stage--editorial">
          {SLIDES.map((slide, index) => (
            <EditorialSlideCard
              key={slide.id}
              slide={slide}
              isActive={index === activeIndex}
            />
          ))}
        </div>

        <div className="home-hero-highlights-dots" role="tablist" aria-label="Destaques">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={slide.label}
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
        {SLIDES.map((slide) => (
          <li key={slide.id}>
            <span>{slide.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
