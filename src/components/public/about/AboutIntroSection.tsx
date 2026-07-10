"use client";

import { useRef } from "react";

import { AboutWhoFeedbackTicker } from "@/components/public/about/AboutWhoFeedbackTicker";
import { SectionHeader } from "@/components/public/SectionHeader";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_WHO_CHIPS } from "@/data/about";

type AboutIntroSectionProps = {
  clinicName: string;
};

export function AboutIntroSection({ clinicName }: AboutIntroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="quem-somos" ref={sectionRef} className="about-ed-who scroll-mt-[var(--header-height)]">
      <div className="container-page about-ed-page">
        <div className="about-ed-who-grid">
          <TimelineContent animationNum={0} timelineRef={sectionRef} className="about-ed-who-ticker-slot">
            <AboutWhoFeedbackTicker />
          </TimelineContent>

          <div className="about-ed-who-copy">
            <TimelineContent animationNum={1} timelineRef={sectionRef}>
              <SectionHeader
                eyebrow="Quem somos"
                title="Uma clínica preparada para simplificar a rotina ocupacional das empresas"
                className="about-ed-section-header about-ed-who-header"
              />
            </TimelineContent>

            <TimelineContent animationNum={2} timelineRef={sectionRef} className="about-ed-prose about-ed-who-prose">
              <p>
                A {clinicName} atua em Medicina e Segurança do Trabalho, apoiando empresas de
                pequeno, médio e grande porte na organização de exames, ASOs, programas, laudos e
                documentação ocupacional com atenção à conformidade legal.
              </p>
              <p>
                Unimos estrutura presencial de qualidade com portal empresarial para
                encaminhamento online, acompanhamento de status e centralização documental.
              </p>
            </TimelineContent>

            <TimelineContent animationNum={3} timelineRef={sectionRef}>
              <ul className="about-ed-who-chips" aria-label="Especialidades">
                {ABOUT_WHO_CHIPS.map((chip) => (
                  <li key={chip}>{chip}</li>
                ))}
              </ul>
            </TimelineContent>
          </div>
        </div>
      </div>
    </section>
  );
}
