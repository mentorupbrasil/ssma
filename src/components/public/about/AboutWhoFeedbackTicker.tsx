"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { ABOUT_WHO_FEEDBACK_HIGHLIGHTS } from "@/data/about";
import { cn } from "@/lib/utils";

type FeedbackItemProps = {
  quote: string;
  topic: string;
  icon: LucideIcon;
  hidden?: boolean;
};

function FeedbackItem({ quote, topic, icon: Icon, hidden = false }: FeedbackItemProps) {
  return (
    <li className="about-ed-who-feedback-item" aria-hidden={hidden || undefined}>
      <span className="about-ed-who-feedback-thumb" aria-hidden>
        <Icon strokeWidth={1.75} />
      </span>

      <div className="about-ed-who-feedback-body">
        <p className="about-ed-who-feedback-topic">{topic}</p>
        <p className="about-ed-who-feedback-quote">{quote}</p>
      </div>

      <span className="about-ed-who-feedback-trail" aria-hidden>
        <Icon strokeWidth={1.5} />
      </span>
    </li>
  );
}

function useStaticTicker() {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return !mounted || reduceMotion || isMobile;
}

export function AboutWhoFeedbackTicker() {
  const showStatic = useStaticTicker();
  const highlights = ABOUT_WHO_FEEDBACK_HIGHLIGHTS;
  const loopItems = [...highlights, ...highlights];

  return (
    <aside className="about-ed-who-ticker" aria-label="O que o RH valoriza">
      <div className="about-ed-who-ticker-card">
        <p className="about-ed-who-ticker-sr-label" id="about-who-ticker-label">
          O que o RH valoriza
        </p>

        <div
          className={cn(
            "about-ed-who-ticker-viewport",
            showStatic && "about-ed-who-ticker-viewport--static"
          )}
        >
          <ul
            className={showStatic ? "about-ed-who-feedback-static" : "about-ed-who-feedback-track"}
            aria-labelledby="about-who-ticker-label"
          >
            {(showStatic ? highlights : loopItems).map((item, index) => (
              <FeedbackItem
                key={`${item.topic}-${index}`}
                {...item}
                hidden={!showStatic && index >= highlights.length}
              />
            ))}
          </ul>

          {!showStatic && (
            <>
              <div className="about-ed-who-ticker-fade about-ed-who-ticker-fade--top" aria-hidden />
              <div className="about-ed-who-ticker-fade about-ed-who-ticker-fade--bottom" aria-hidden />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
