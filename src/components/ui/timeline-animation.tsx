"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const aboutRevealVariants: Variants = {
  hidden: { opacity: 1, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export const aboutScaleVariants: Variants = {
  hidden: { opacity: 1, scale: 0.99, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.42,
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
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [forceVisible, setForceVisible] = useState(false);
  const isInView = useInView(timelineRef ?? localRef, {
    once: true,
    margin: eager ? "0px" : "-8% 0px",
    amount: 0.12,
  });
  const MotionComponent = motion.create((as ?? "div") as "div");
  const Component = (as ?? "div") as ElementType;
  const shouldShow = eager || isInView || forceVisible;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (eager || isInView) {
      setForceVisible(true);
      return;
    }

    const timeoutId = window.setTimeout(() => setForceVisible(true), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [eager, isInView]);

  if (!mounted || reducedMotion) {
    return (
      <Component className={className} ref={localRef as never} {...(props as object)}>
        {children}
      </Component>
    );
  }

  return (
    <MotionComponent
      ref={localRef}
      data-about-reveal
      initial={eager ? "visible" : "hidden"}
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
