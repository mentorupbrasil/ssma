"use client";

import Image from "next/image";
import { FileCheck, LayoutDashboard, Shield, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

import { aboutScaleVariants, TimelineContent } from "@/components/ui/timeline-animation";
import { ABOUT_FLOATING_TAGS } from "@/data/about";
import { siteMedia } from "@/config/media";
import { cn } from "@/lib/utils";

const FLOATING_CARDS = [
  { label: "ASO", icon: Stethoscope, className: "about-hero-float--aso" },
  { label: "PCMSO", icon: FileCheck, className: "about-hero-float--pcmso" },
  { label: "PGR", icon: Shield, className: "about-hero-float--pgr" },
  { label: "Portal", icon: LayoutDashboard, className: "about-hero-float--portal" },
] as const;

const CLIP_PATH_ID = "about-hero-clip";

type AboutHeroVisualProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

export function AboutHeroVisual({ sectionRef }: AboutHeroVisualProps) {
  const heroImage = siteMedia.heroImage || siteMedia.gallery[0]?.src || "";

  return (
    <div className="about-hero-visual">
      <TimelineContent
        as="figure"
        animationNum={3}
        timelineRef={sectionRef}
        customVariants={aboutScaleVariants}
        className="about-hero-visual-frame"
      >
        <svg
          className="about-hero-visual-svg"
          viewBox="0 0 100 62"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <clipPath id={CLIP_PATH_ID} clipPathUnits="objectBoundingBox">
              <path d="M0.08 1H0.38H0.72C0.76 1 0.78 0.96 0.78 0.93V0.82C0.79 0.76 0.81 0.74 0.83 0.75H0.96C0.99 0.74 1 0.69 0.99 0.66V0.08C0.99 0.03 0.97 0.01 0.96 0H0.88C0.84 0 0.87 0.12 0.83 0.12H0.04C0.02 0.13 0 0.17 0 0.2V0.42C0 0.45 0.02 0.47 0.04 0.48H0.06C0.08 0.48 0.09 0.51 0.09 0.53V0.9C0.08 0.97 0.09 1 0.08 1Z" />
            </clipPath>
            <linearGradient id="about-hero-fallback" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dff7f0" />
              <stop offset="45%" stopColor="#a7f3d0" />
              <stop offset="100%" stopColor="#0f3d4a" />
            </linearGradient>
          </defs>
          <rect width="100" height="62" fill="url(#about-hero-fallback)" clipPath={`url(#${CLIP_PATH_ID})`} />
        </svg>

        {heroImage ? (
          <div className="about-hero-visual-photo-wrap">
            <Image
              src={heroImage}
              alt="Estrutura da Unimetra"
              fill
              className="about-hero-visual-photo"
              sizes="(max-width: 1024px) 90vw, 520px"
              priority
            />
          </div>
        ) : null}

        <div className="about-hero-visual-overlay" aria-hidden />
      </TimelineContent>

      {FLOATING_CARDS.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            className={cn("about-hero-float", card.className)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + index * 0.08, duration: 0.45 }}
          >
            <span className="about-hero-float-icon">
              <Icon strokeWidth={1.75} />
            </span>
            <span>{card.label}</span>
          </motion.div>
        );
      })}

      <div className="about-hero-tag-row" aria-hidden>
        {ABOUT_FLOATING_TAGS.map((tag) => (
          <span key={tag} className="about-hero-tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
