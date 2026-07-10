"use client";

import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

type InfiniteSliderProps = {
  children: ReactNode;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
  reverse?: boolean;
  className?: string;
};

export function InfiniteSlider({
  children,
  gap = 24,
  speed = 80,
  speedOnHover,
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [hovered, setHovered] = useState(false);
  const duration = hovered && speedOnHover ? speedOnHover : speed;

  return (
    <div
      className={cn("overflow-hidden", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "infinite-slider-track flex w-max items-center",
          reverse && "infinite-slider-track--reverse"
        )}
        style={
          {
            gap: `${gap}px`,
            "--infinite-slider-duration": `${duration}s`,
          } as React.CSSProperties
        }
      >
        <div className="flex items-center" style={{ gap: `${gap}px` }}>
          {children}
        </div>
        <div className="flex items-center" aria-hidden style={{ gap: `${gap}px` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
