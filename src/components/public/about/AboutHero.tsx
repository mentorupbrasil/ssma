"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";

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
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [wordIndex, words.length, reduceMotion]);

  const lead = `A ${clinicName} apoia empresas na organização de exames, documentos ocupacionais e rotinas de SST com atendimento presencial e recursos digitais para o RH.`;
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com um especialista da ${getClinicInfo().name}.`
  );

  return (
    <section ref={sectionRef} className="about-ed-hero scroll-mt-[var(--header-height)]">
      <div className="about-ed-hero-bg" aria-hidden />
      <div className="container-page">
        <div className="about-ed-hero-inner">
          <TimelineContent animationNum={0} timelineRef={sectionRef} eager>
            <Link href="#quem-somos">
              <Button variant="secondary" size="sm" className="about-ed-hero-badge gap-2">
                Conheça a Unimetra
                <MoveRight className="size-3.5" aria-hidden />
              </Button>
            </Link>
          </TimelineContent>

          <div className="about-ed-hero-heading">
            <h1 className="about-ed-hero-title">
              <span className="about-ed-hero-title-line">Saúde ocupacional com</span>
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
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        wordIndex === index
                          ? { y: 0, opacity: 1 }
                          : {
                              y: wordIndex > index ? "-150%" : "150%",
                              opacity: 0,
                            }
                      }
                    >
                      {word}
                    </motion.span>
                  ))
                )}
              </span>
              <span className="about-ed-hero-title-line">para empresas</span>
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
                <Button size="lg" variant="outline" className="gap-2">
                  Falar com especialista
                  <PhoneCall className="size-4" aria-hidden />
                </Button>
              </a>
              <Link href="/servicos">
                <Button size="lg" variant="brand" className="gap-2">
                  Nossos serviços
                  <MoveRight className="size-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
