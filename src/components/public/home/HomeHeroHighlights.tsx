"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import {
  HOME_HERO_NEWS_SLIDES,
  type NewsSlide,
  type NewsSlideAccent,
} from "@/data/home-hero-news-slides";
import { NewsSlideVisual } from "@/components/public/home/hero-news/NewsSlideVisual";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD_PX = 48;
const RESUME_AUTOPLAY_MS = 5000;

const ACCENT_CLASS: Record<NewsSlideAccent, string> = {
  emerald: "home-hero-news-slide--emerald",
  amber: "home-hero-news-slide--amber",
  campaign: "home-hero-news-slide--campaign",
};

const TAB_ACCENT_CLASS: Record<NewsSlideAccent, string> = {
  emerald: "home-hero-highlights-tab--emerald",
  amber: "home-hero-highlights-tab--amber",
  campaign: "home-hero-highlights-tab--campaign",
};

function NewsSlidePanel({ slide, isActive }: { slide: NewsSlide; isActive: boolean }) {
  return (
    <article
      id={`home-hero-news-slide-${slide.id}`}
      className={cn("home-hero-news-slide", ACCENT_CLASS[slide.accent], isActive && "is-active")}
      role="tabpanel"
      aria-labelledby={`home-hero-news-tab-${slide.id}`}
      aria-hidden={!isActive}
    >
      <div className="home-hero-news-slide__layout">
        <div className="home-hero-news-slide__copy">
          <p className="home-hero-news-slide__eyebrow">{slide.eyebrow}</p>
          <h2 className="home-hero-news-slide__title">{slide.title}</h2>
          <p className="home-hero-news-slide__desc">{slide.description}</p>

          <ul className="home-hero-news-slide__benefits">
            {slide.benefits.map((benefit) => (
              <li key={benefit}>
                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="home-hero-news-slide__cta">
            <Link href={slide.action.href} className="home-hero-news-slide__btn">
              {slide.action.label}
            </Link>
          </div>
        </div>

        <aside className="home-hero-news-slide__visual" aria-hidden>
          <NewsSlideVisual type={slide.visualType} />
        </aside>
      </div>
    </article>
  );
}

export function HomeHeroHighlights() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [announcedTitle, setAnnouncedTitle] = useState(HOME_HERO_NEWS_SLIDES[0].title);
  const resumeTimerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const slideCount = HOME_HERO_NEWS_SLIDES.length;

  const goToSlide = useCallback(
    (index: number) => {
      const nextIndex = ((index % slideCount) + slideCount) % slideCount;
      setActiveIndex(nextIndex);
    },
    [slideCount]
  );

  const pauseAutoplay = useCallback(() => {
    setIsPaused(true);
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const scheduleAutoplayResume = useCallback(() => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
      resumeTimerRef.current = null;
    }, RESUME_AUTOPLAY_MS);
  }, []);

  const handleUserNavigate = useCallback(
    (index: number) => {
      pauseAutoplay();
      goToSlide(index);
      setAnnouncedTitle(HOME_HERO_NEWS_SLIDES[index].title);
      scheduleAutoplayResume();
    },
    [goToSlide, pauseAutoplay, scheduleAutoplayResume]
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(media.matches);

    updateMotionPreference();
    media.addEventListener("change", updateMotionPreference);

    return () => media.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion, slideCount]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handleUserNavigate(activeIndex - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      handleUserNavigate(activeIndex + 1);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;

    if (startX === null || endX === undefined) {
      return;
    }

    const delta = endX - startX;

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) {
      return;
    }

    handleUserNavigate(delta > 0 ? activeIndex - 1 : activeIndex + 1);
    touchStartXRef.current = null;
  };

  return (
    <div
      ref={carouselRef}
      className="home-hero-highlights"
      aria-roledescription="carrossel"
      aria-label="Novidades e destaques"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={pauseAutoplay}
      onBlurCapture={(event) => {
        if (!carouselRef.current?.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      <div className="home-hero-highlights-frame">
        <p className="home-hero-highlights-kicker">Novidades</p>

        <div className="home-hero-highlights-stage">
          {HOME_HERO_NEWS_SLIDES.map((slide, index) => (
            <NewsSlidePanel key={slide.id} slide={slide} isActive={index === activeIndex} />
          ))}
        </div>

        <div className="home-hero-highlights-controls">
          <div
            className="home-hero-highlights-nav"
            role="tablist"
            aria-label="Navegação do carrossel de novidades"
          >
            {HOME_HERO_NEWS_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                id={`home-hero-news-tab-${slide.id}`}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-controls={`home-hero-news-slide-${slide.id}`}
                aria-label={slide.tabLabel}
                className={cn(
                  "home-hero-highlights-nav-item",
                  index === activeIndex && "home-hero-highlights-nav-item--active",
                  TAB_ACCENT_CLASS[slide.accent]
                )}
                onClick={() => handleUserNavigate(index)}
              >
                <span className="home-hero-highlights-nav-dot" aria-hidden />
                <span className="home-hero-highlights-nav-label">{slide.tabLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Slide ativo: {announcedTitle}
      </p>
    </div>
  );
}
