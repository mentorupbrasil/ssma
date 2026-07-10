import { Stethoscope } from "lucide-react";

export function AboutHeroPanel() {
  return (
    <div className="about-ed-hero-art-wrap">
      <div className="about-ed-hero-art" aria-hidden>
        <div className="about-ed-hero-art-ring about-ed-hero-art-ring--outer" />
        <div className="about-ed-hero-art-ring about-ed-hero-art-ring--inner" />
        <div className="about-ed-hero-art-core">
          <Stethoscope strokeWidth={1.5} />
        </div>
        <div className="about-ed-hero-art-line about-ed-hero-art-line--a" />
        <div className="about-ed-hero-art-line about-ed-hero-art-line--b" />
      </div>
      <p className="about-ed-hero-art-caption">
        <span>Imperatriz — MA</span>
        <span className="about-ed-hero-art-caption-dot" aria-hidden>
          ·
        </span>
        <span>Medicina e Segurança do Trabalho</span>
      </p>
    </div>
  );
}
