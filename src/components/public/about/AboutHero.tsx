"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";

import { AboutHeroPanel } from "@/components/public/about/AboutHeroPanel";
import { Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_HERO_ROTATING_WORDS } from "@/data/about";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

type AboutHeroProps = {
  clinicName: string;
};

export function AboutHero({ clinicName }: AboutHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);
  const words = useMemo(() => [...ABOUT_HERO_ROTATING_WORDS], []);

  useEffect(() => {
    if (reduceMotion) return;

    const timeoutId = window.setTimeout(() => {
      setWordIndex((current) => (current === words.length - 1 ? 0 : current + 1));
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [wordIndex, words.length, reduceMotion]);

  const lead = `Apoiamos empresas na organização de exames, documentos ocupacionais e rotinas de SST — com atendimento presencial e portal digital para o RH.`;
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com um especialista da ${getClinicInfo().name}.`
  );

  return (
    <section ref={sectionRef} className="about-ed-hero scroll-mt-[var(--header-height)]">
      <div className="about-ed-hero-bg" aria-hidden />
      <div className="container-page about-ed-page">
        <div className="about-ed-hero-grid">
          <div className="about-ed-hero-copy">
            <TimelineContent animationNum={0} timelineRef={sectionRef} eager>
              <p className="about-ed-hero-eyebrow">Institucional · {clinicName}</p>
            </TimelineContent>

            <h1 className="about-ed-hero-title">
              Saúde ocupacional com{" "}
              <span className="about-ed-hero-title-rotator" aria-live="polite">
                {reduceMotion ? (
                  <span className="about-ed-hero-title-word about-ed-hero-title-word--static">
                    {words[0]}
                  </span>
                ) : (
                  words.map((word, index) => (
                    <motion.span
                      key={word}
                      className="about-ed-hero-title-word"
                      initial={{ opacity: 0, y: "-100%" }}
                      transition={{ type: "spring", stiffness: 55, damping: 14 }}
                      animate={
                        wordIndex === index
                          ? { y: 0, opacity: 1 }
                          : {
                              y: wordIndex > index ? "-120%" : "120%",
                              opacity: 0,
                            }
                      }
                    >
                      {word}
                    </motion.span>
                  ))
                )}
              </span>{" "}
              para empresas
            </h1>

            <TimelineContent animationNum={1} timelineRef={sectionRef} eager>
              <p className="about-ed-hero-lead">{lead}</p>
            </TimelineContent>

            <TimelineContent animationNum={2} timelineRef={sectionRef} eager>
              <div className="about-ed-hero-actions">
                <a
                  href={whatsappHref}
                  target={whatsappHref.startsWith("http") ? "_blank" : undefined}
                  rel={whatsappHref.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <Button variant="brand" className="gap-2 rounded-xl">
                    <Phone className="size-4" aria-hidden />
                    Falar com especialista
                  </Button>
                </a>
                <Link href="/servicos">
                  <Button variant="outline" className="gap-2 rounded-xl">
                    Nossos serviços
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </Link>
              </div>

              <p className="about-ed-hero-trust">
                <Shield className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                Medicina do Trabalho · Segurança do Trabalho · Portal empresarial
              </p>
            </TimelineContent>
          </div>

          <TimelineContent
            animationNum={3}
            timelineRef={sectionRef}
            eager
            as="figure"
            className="about-ed-hero-panel-wrap"
          >
            <AboutHeroPanel clinicName={clinicName} />
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
