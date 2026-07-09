"use client";

import { useRef } from "react";

import { AboutInstitutionalVisual } from "@/components/public/about/AboutInstitutionalVisual";
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
              <p className="about-ed-label">Quem somos</p>
            </TimelineContent>

            <TimelineContent animationNum={1} timelineRef={sectionRef}>
              <h2 className="about-ed-heading">
                Uma clínica preparada para simplificar a rotina ocupacional das empresas
              </h2>
            </TimelineContent>

            <TimelineContent animationNum={2} timelineRef={sectionRef} className="about-ed-prose">
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
          </div>

          <TimelineContent animationNum={3} timelineRef={sectionRef} className="about-ed-who-aside">
            <div className="about-ed-who-visual">
              <AboutInstitutionalVisual />
            </div>
            <ul className="about-ed-who-chips" aria-label="Especialidades">
              {ABOUT_WHO_CHIPS.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
            <p className="about-ed-who-signature">
              Estrutura clínica, organização documental e tecnologia a serviço do RH.
            </p>
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
