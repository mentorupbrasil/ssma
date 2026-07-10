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
};

function FeedbackItem({ quote, topic, icon: Icon }: FeedbackItemProps) {
  return (
    <article className="about-ed-who-feedback-item">
      <span className="about-ed-who-feedback-icon" aria-hidden>
        <Icon strokeWidth={1.75} />
      </span>
      <div className="about-ed-who-feedback-body">
        <p className="about-ed-who-feedback-topic">{topic}</p>
        <p className="about-ed-who-feedback-quote">{quote}</p>
      </div>
    </article>
  );
}

function useStaticTicker() {
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduceMotion || isMobile;
}

export function AboutWhoFeedbackTicker() {
  const showStatic = useStaticTicker();
  const highlights = ABOUT_WHO_FEEDBACK_HIGHLIGHTS;
  const loopItems = [...highlights, ...highlights];

  return (
    <aside className="about-ed-who-ticker" aria-label="O que o RH valoriza">
      <div className="about-ed-who-ticker-card">
        <div className="about-ed-who-ticker-head">
          <p className="about-ed-who-ticker-eyebrow">O que o RH valoriza</p>
        </div>

        <div
          className={cn(
            "about-ed-who-ticker-viewport",
            showStatic && "about-ed-who-ticker-viewport--static"
          )}
        >
          {showStatic ? (
            <div className="about-ed-who-feedback-static">
              {highlights.map((item) => (
                <FeedbackItem key={item.topic} {...item} />
              ))}
            </div>
          ) : (
            <div className="about-ed-who-feedback-track" aria-hidden>
              {loopItems.map((item, index) => (
                <FeedbackItem key={`${item.topic}-${index}`} {...item} />
              ))}
            </div>
          )}

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
