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
      <div className="container-page">
        <div className="about-ed-who-grid">
          <div className="about-ed-who-copy">
            <TimelineContent animationNum={0} timelineRef={sectionRef}>
              <SectionHeader
                eyebrow="Quem somos"
                title="Uma clínica preparada para simplificar a rotina ocupacional das empresas"
                className="about-ed-section-header"
              />
            </TimelineContent>

            <TimelineContent animationNum={1} timelineRef={sectionRef} className="about-ed-prose">
              <p>
                A {clinicName} atua em Medicina e Segurança do Trabalho, apoiando empresas de
                pequeno, médio e grande porte na organização de exames, ASOs, programas, laudos e
                documentação ocupacional com atenção à conformidade legal.
              </p>
              <p>
                Nosso diferencial é unir estrutura presencial de qualidade com um portal
                empresarial para encaminhamento online, acompanhamento de status e centralização
                documental — menos retrabalho para o RH, mais previsibilidade para a empresa.
              </p>
            </TimelineContent>

            <TimelineContent animationNum={2} timelineRef={sectionRef}>
              <ul className="about-ed-who-chips" aria-label="Especialidades">
                {ABOUT_WHO_CHIPS.map((chip) => (
                  <li key={chip}>{chip}</li>
                ))}
              </ul>

              <blockquote className="about-ed-who-signature">
                Estrutura clínica, organização documental e tecnologia a serviço do RH.
              </blockquote>
            </TimelineContent>
          </div>

          <TimelineContent animationNum={3} timelineRef={sectionRef}>
            <AboutWhoFeedbackTicker />
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
