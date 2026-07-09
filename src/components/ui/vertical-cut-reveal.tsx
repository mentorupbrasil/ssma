"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type VerticalCutRevealProps = {
  children: string;
  className?: string;
  splitBy?: "words" | "chars";
  staggerDuration?: number;
  staggerFrom?: "first" | "last";
  delay?: number;
};

export function VerticalCutReveal({
  children,
  className,
  splitBy = "words",
  staggerDuration = 0.045,
  staggerFrom = "first",
  delay = 0,
}: VerticalCutRevealProps) {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (reducedMotion) {
    return <span className={className}>{children}</span>;
  }

  const units =
    splitBy === "chars"
      ? children.split("")
      : children.split(/(\s+)/).filter((part) => part.length > 0);

  return (
    <span className={cn("inline", className)} aria-label={children}>
      {units.map((unit, index) => {
        const staggerIndex = staggerFrom === "last" ? units.length - 1 - index : index;
        const isSpace = /^\s+$/.test(unit);

        if (isSpace) {
          return <span key={`space-${index}`}>{unit}</span>;
        }

        return (
          <span key={`${unit}-${index}`} className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 28,
                delay: delay + staggerIndex * staggerDuration,
              }}
            >
              {unit}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

export function VerticalCutRevealBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}
