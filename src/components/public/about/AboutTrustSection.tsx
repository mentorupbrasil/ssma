"use client";

import { useRef } from "react";
import { Check } from "lucide-react";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_TRUST_CHECKLIST } from "@/data/about";

export function AboutTrustSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="conformidade"
      ref={sectionRef}
      className="about-ed-trust scroll-mt-[var(--header-height)]"
    >
      <div className="container-page">
        <div className="about-ed-trust-panel">
          <div className="about-ed-trust-copy">
            <TimelineContent animationNum={0} timelineRef={sectionRef}>
              <p className="about-ed-trust-eyebrow">Estrutura e conformidade</p>
            </TimelineContent>
            <TimelineContent animationNum={1} timelineRef={sectionRef}>
              <h2 className="about-ed-trust-title">
                Estrutura, confiança e conformidade
              </h2>
            </TimelineContent>
            <TimelineContent animationNum={2} timelineRef={sectionRef} className="about-ed-trust-desc">
              Dados ocupacionais exigem cuidado, organização e controle. Por isso, a Unimetra
              trabalha com fluxos pensados para apoiar empresas na gestão de documentos, exames e
              informações sensíveis — com portal empresarial como apoio ao atendimento da clínica.
            </TimelineContent>
          </div>

          <TimelineContent animationNum={3} timelineRef={sectionRef}>
            <ul className="about-ed-trust-list" aria-label="Compromissos institucionais">
              {ABOUT_TRUST_CHECKLIST.map((item, index) => (
                <li key={item}>
                  <span className="about-ed-trust-index" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Check className="about-ed-trust-check" strokeWidth={2.25} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
