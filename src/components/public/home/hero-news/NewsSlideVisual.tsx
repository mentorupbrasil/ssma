import type { ReactElement } from "react";
import { BadgeCheck, FlaskConical } from "lucide-react";
import type { NewsSlideVisualType } from "@/data/home-hero-news-slides";

const CONCURSO_STEPS = [
  { title: "Edital", hint: "Conforme edital" },
  { title: "Exames", hint: "Pacote organizado" },
  { title: "Resultado", hint: "Laudo para posse" },
] as const;

const JULHO_CAMPAIGNS = [
  {
    tone: "yellow" as const,
    label: "Julho Amarelo",
    title: "Hepatites virais",
    description: "Prevenção, informação e diagnóstico precoce.",
  },
  {
    tone: "green" as const,
    label: "Julho Verde",
    title: "Câncer de cabeça e pescoço",
    description: "Conscientização, sinais de alerta e prevenção.",
  },
] as const;

function ToxicologicoVisual() {
  return (
    <div className="home-hero-news-visual home-hero-news-visual--emerald">
      <div className="home-hero-news-visual-card">
        <span className="home-hero-news-visual-icon" aria-hidden>
          <FlaskConical strokeWidth={1.75} />
        </span>
        <div className="home-hero-news-visual-card-copy">
          <p className="home-hero-news-visual-card-title">Coleta disponível</p>
          <p className="home-hero-news-visual-card-sub">CNH e PCMSO</p>
        </div>
      </div>
      <p className="home-hero-news-visual-seal">
        <BadgeCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span>Conforme exigências legais</span>
      </p>
    </div>
  );
}

function ConcursoVisual() {
  return (
    <div className="home-hero-news-visual home-hero-news-visual--amber">
      <ol className="home-hero-news-visual-flow">
        {CONCURSO_STEPS.map((step, index) => (
          <li key={step.title} className="home-hero-news-visual-flow-step">
            <span className="home-hero-news-visual-flow-num" aria-hidden>
              {index + 1}
            </span>
            <div>
              <p className="home-hero-news-visual-flow-title">{step.title}</p>
              <p className="home-hero-news-visual-flow-hint">{step.hint}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function JulhoVisual() {
  return (
    <div className="home-hero-news-visual home-hero-news-visual--campaign">
      {JULHO_CAMPAIGNS.map((campaign) => (
        <div
          key={campaign.label}
          className={`home-hero-news-visual-campaign home-hero-news-visual-campaign--${campaign.tone}`}
        >
          <p className="home-hero-news-visual-campaign-label">{campaign.label}</p>
          <p className="home-hero-news-visual-campaign-title">{campaign.title}</p>
          <p className="home-hero-news-visual-campaign-desc">{campaign.description}</p>
        </div>
      ))}
    </div>
  );
}

const VISUALS: Record<NewsSlideVisualType, () => ReactElement> = {
  toxicologico: ToxicologicoVisual,
  concurso: ConcursoVisual,
  julho: JulhoVisual,
};

export function NewsSlideVisual({ type }: { type: NewsSlideVisualType }) {
  const Visual = VISUALS[type];
  return <Visual />;
}
