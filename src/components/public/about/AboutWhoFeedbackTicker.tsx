"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { ABOUT_WHO_FEEDBACK } from "@/data/about";

type FeedbackItemProps = {
  quote: string;
  topic: string;
  icon: LucideIcon;
};

function FeedbackItem({ quote, topic, icon: Icon }: FeedbackItemProps) {
  const initial = topic.charAt(0).toUpperCase();

  return (
    <article className="about-ed-who-feedback-item">
      <div className="about-ed-who-feedback-avatar" aria-hidden>
        <span>{initial}</span>
      </div>

      <div className="about-ed-who-feedback-body">
        <p className="about-ed-who-feedback-quote">{quote}</p>
        <p className="about-ed-who-feedback-topic">{topic}</p>
      </div>

      <div className="about-ed-who-feedback-icon" aria-hidden>
        <Icon strokeWidth={1.75} />
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
          <p className="about-ed-who-ticker-eyebrow">Destaques para empresas</p>
          <p className="about-ed-who-ticker-caption">O que o RH valoriza na rotina ocupacional</p>
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
                duration: 18,
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
