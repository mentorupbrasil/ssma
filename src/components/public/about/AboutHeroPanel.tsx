import { Building2, Check } from "lucide-react";
import { ABOUT_HERO_PILLARS } from "@/data/about";

import { AboutGridPattern } from "@/components/public/about/AboutGridPattern";

type AboutHeroPanelProps = {
  clinicName: string;
};

export function AboutHeroPanel({ clinicName }: AboutHeroPanelProps) {
  return (
    <div className="about-ed-hero-panel" aria-hidden>
      <div className="about-ed-hero-panel-pattern">
        <AboutGridPattern squares={[[6, 1], [7, 3], [8, 2], [9, 5]]} />
      </div>

      <div className="about-ed-hero-panel-main">
        <div className="about-ed-hero-panel-head">
          <span className="about-ed-hero-panel-icon">
            <Building2 strokeWidth={1.65} />
          </span>
          <div>
            <p className="about-ed-hero-panel-brand">{clinicName}</p>
            <p className="about-ed-hero-panel-sub">Medicina e Segurança do Trabalho</p>
          </div>
        </div>

        <svg
          className="about-ed-hero-panel-ecg"
          viewBox="0 0 240 24"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 12 H28 L34 6 L40 18 L46 10 L52 14 H88 L94 8 L100 16 L106 11 L112 14 H148 L154 7 L160 17 L166 12 L172 14 H240"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <ul className="about-ed-hero-panel-list">
          {ABOUT_HERO_PILLARS.map((item) => (
            <li key={item}>
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="about-ed-hero-panel-foot">
          Atendimento presencial com apoio digital para o RH
        </p>
      </div>
    </div>
  );
}
