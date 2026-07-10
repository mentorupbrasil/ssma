"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import "@/styles/home-hero-slideshow.css";

const SLIDES = [
  "/images/hero/slides/slide-1.png",
  "/images/hero/slides/slide-2.png",
  "/images/hero/slides/slide-3.png",
  "/images/hero/slides/slide-4.png",
] as const;

const INTERVAL_MS = 5000;

export function HomeHeroSlideshow() {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % SLIDES.length);
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const prev = (active - 1 + SLIDES.length) % SLIDES.length;

  return (
    <div className="home-hero-slideshow" aria-hidden>
      {SLIDES.map((src, index) => (
        <div
          key={src}
          className={cn(
            "home-hero-slideshow__slide",
            index === active && "is-active",
            index === prev && "is-prev"
          )}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            priority={index === 0}
            className="home-hero-slideshow__img"
          />
        </div>
      ))}
    </div>
  );
}
