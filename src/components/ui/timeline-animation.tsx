"use client";

import {
  motion,
  useInView,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export const aboutRevealVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.07,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export const aboutScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.07,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

type TimelineContentProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  animationNum?: number;
  timelineRef?: React.RefObject<HTMLElement | null>;
  customVariants?: Variants;
  eager?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">;

export function TimelineContent<T extends ElementType = "div">({
  as,
  children,
  className,
  animationNum = 0,
  timelineRef,
  customVariants = aboutRevealVariants,
  eager = false,
  ...props
}: TimelineContentProps<T>) {
  const localRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(timelineRef ?? localRef, {
    once: true,
    margin: eager ? "0px" : "-10% 0px",
  });
  const reducedMotion = usePrefersReducedMotion();
  const MotionComponent = motion.create((as ?? "div") as "div");
  const shouldShow = eager || isInView;

  if (reducedMotion) {
    const Component = (as ?? "div") as ElementType;
    return (
      <Component className={className} ref={localRef as never} {...(props as object)}>
        {children}
      </Component>
    );
  }

  return (
    <MotionComponent
      ref={localRef}
      initial="hidden"
      animate={shouldShow ? "visible" : "hidden"}
      custom={animationNum}
      variants={customVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
