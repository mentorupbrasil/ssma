"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

import { ABOUT_WHO_FEEDBACK } from "@/data/about";
import { motion, useReducedMotion } from "framer-motion";

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

export function AboutWhoFeedbackTicker() {
  const reduceMotion = useReducedMotion();
  const items = [...ABOUT_WHO_FEEDBACK, ...ABOUT_WHO_FEEDBACK];

  return (
    <aside className="about-ed-who-ticker" aria-label="Destaques para empresas">
      <div className="about-ed-who-ticker-card">
        <div className="about-ed-who-ticker-head">
          <p className="about-ed-who-ticker-eyebrow">O que o RH valoriza</p>
        </div>

        <div className="about-ed-who-ticker-viewport">
          {reduceMotion ? (
            <div className="about-ed-who-feedback-static">
              {ABOUT_WHO_FEEDBACK.map((item) => (
                <FeedbackItem key={item.topic} {...item} />
              ))}
            </div>
          ) : (
            <motion.div
              className="about-ed-who-feedback-track"
              animate={{ y: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                repeatType: "loop",
                duration: 20,
                ease: "linear",
              }}
            >
              {items.map((item, index) => (
                <FeedbackItem key={`${item.topic}-${index}`} {...item} />
              ))}
            </motion.div>
          )}

          <div className="about-ed-who-ticker-fade about-ed-who-ticker-fade--top" aria-hidden />
          <div className="about-ed-who-ticker-fade about-ed-who-ticker-fade--bottom" aria-hidden />
        </div>
      </div>
    </aside>
  );
}
