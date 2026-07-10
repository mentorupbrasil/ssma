"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MoveRight, Phone } from "lucide-react";

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
  const [motionReady, setMotionReady] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const words = useMemo(() => [...ABOUT_HERO_ROTATING_WORDS], []);
  const animateTitle = motionReady && !reduceMotion;

  useEffect(() => {
    setMotionReady(true);
  }, []);

  useEffect(() => {
    if (!animateTitle) return;

    const timeoutId = window.setTimeout(() => {
      setWordIndex((current) => (current === words.length - 1 ? 0 : current + 1));
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [wordIndex, words.length, animateTitle]);

  const lead =
    "Apoiamos empresas na organização de exames, documentos ocupacionais e rotinas de SST — com atendimento presencial e portal digital para o RH.";
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com um especialista da ${getClinicInfo().name}.`
  );

  return (
    <section ref={sectionRef} className="about-ed-hero scroll-mt-[var(--header-height)]">
      <div className="container-page about-ed-page">
        <div className="about-ed-hero-inner">
          <TimelineContent animationNum={0} timelineRef={sectionRef} eager>
            <Link href="#quem-somos" className="about-ed-hero-badge-link">
              <Button variant="secondary" size="sm" className="about-ed-hero-badge gap-2 rounded-full">
                Conheça a {clinicName}
                <MoveRight className="size-3.5" aria-hidden />
              </Button>
            </Link>
          </TimelineContent>

          <div className="about-ed-hero-heading">
            <h1 className="about-ed-hero-title">
              <span className="about-ed-hero-title-line">Saúde ocupacional com</span>
              <span className="about-ed-hero-title-rotator" aria-live="polite">
                {!animateTitle ? (
                  <span className="about-ed-hero-title-word about-ed-hero-title-word--static">
                    {words[wordIndex]}
                  </span>
                ) : (
                  words.map((word, index) => (
                    <motion.span
                      key={word}
                      className="about-ed-hero-title-word"
                      initial={false}
                      transition={{ type: "spring", stiffness: 55, damping: 14 }}
                      animate={
                        wordIndex === index
                          ? { y: "0%", opacity: 1 }
                          : {
                              y: wordIndex > index ? "-100%" : "100%",
                              opacity: 0,
                            }
                      }
                    >
                      {word}
                    </motion.span>
                  ))
                )}
              </span>
            </h1>

            <TimelineContent animationNum={1} timelineRef={sectionRef} eager>
              <p className="about-ed-hero-lead">{lead}</p>
            </TimelineContent>
          </div>

          <TimelineContent animationNum={2} timelineRef={sectionRef} eager>
            <div className="about-ed-hero-actions">
              <a
                href={whatsappHref}
                target={whatsappHref.startsWith("http") ? "_blank" : undefined}
                rel={whatsappHref.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                <Button variant="outline" className="gap-2 rounded-xl">
                  Falar com especialista
                  <Phone className="size-4" aria-hidden />
                </Button>
              </a>
              <Link href="/servicos">
                <Button variant="brand" className="gap-2 rounded-xl">
                  Nossos serviços
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
