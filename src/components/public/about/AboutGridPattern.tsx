"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

const DEFAULT_SQUARES: number[][] = [
  [7, 1],
  [8, 3],
  [9, 2],
  [10, 5],
];

type AboutGridPatternProps = {
  className?: string;
  squares?: number[][];
  width?: number;
  height?: number;
};

export function AboutGridPattern({
  className,
  squares = DEFAULT_SQUARES,
  width = 20,
  height = 20,
}: AboutGridPatternProps) {
  const patternId = useId();

  return (
    <svg aria-hidden className={cn("about-ed-grid-pattern", className)}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x="0"
          y="0"
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      <g className="about-ed-grid-pattern-squares">
        {squares.map(([x, y], index) => (
          <rect
            key={index}
            strokeWidth="0"
            width={width + 1}
            height={height + 1}
            x={x * width}
            y={y * height}
            fill="currentColor"
          />
        ))}
      </g>
    </svg>
  );
}
