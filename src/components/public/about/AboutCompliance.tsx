"use client";

import { useRef } from "react";
import { Info } from "lucide-react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { ABOUT_COMPLIANCE } from "@/data/about";

export function AboutCompliance() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="conformidade"
      ref={sectionRef}
      className="about-compliance scroll-mt-[var(--header-height)]"
    >
      <div className="container-page">
        <div className="about-compliance-header">
          <TimelineContent animationNum={0} timelineRef={sectionRef}>
            <p className="about-eyebrow about-eyebrow--muted">Conformidade</p>
          </TimelineContent>
          <h2 className="about-section-heading about-section-heading--center">
            <VerticalCutReveal delay={0.02}>
              Compromisso com conformidade, segurança e responsabilidade
            </VerticalCutReveal>
          </h2>
          <TimelineContent animationNum={1} timelineRef={sectionRef} className="about-compliance-copy">
            Dados ocupacionais exigem cuidado, organização e controle. Por isso, a Unimetra
            trabalha com fluxos pensados para apoiar empresas na gestão de documentos, exames e
            informações sensíveis.
          </TimelineContent>
        </div>

        <div className="about-compliance-grid">
          {ABOUT_COMPLIANCE.map((item, index) => {
            const Icon = item.icon;
            return (
              <TimelineContent
                key={item.title}
                animationNum={index + 2}
                timelineRef={sectionRef}
                className="about-compliance-card"
              >
                <div className="about-compliance-card-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <p className="about-compliance-card-title">{item.title}</p>
              </TimelineContent>
            );
          })}
        </div>

        <TimelineContent animationNum={6} timelineRef={sectionRef} className="about-compliance-note">
          <Info className="about-compliance-note-icon" strokeWidth={1.75} />
          <p>
            O portal empresarial complementa o atendimento da clínica, facilitando o acompanhamento
            de solicitações, documentos e status ocupacionais.
          </p>
        </TimelineContent>
      </div>
    </section>
  );
}
