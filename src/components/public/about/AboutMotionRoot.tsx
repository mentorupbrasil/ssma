"use client";

import { useEffect } from "react";

/** Marca a página Sobre como hidratada para fallbacks de motion no CSS. */
export function AboutMotionRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("about-ed-ready");
    return () => document.documentElement.classList.remove("about-ed-ready");
  }, []);

  return children;
}
