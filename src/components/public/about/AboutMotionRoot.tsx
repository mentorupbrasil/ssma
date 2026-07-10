"use client";

import { useEffect } from "react";

/** Marca a página Sobre como hidratada para fallbacks de motion no CSS. */
export function AboutMotionRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("about-v2-ready");
    return () => {
      document.documentElement.classList.remove("about-v2-ready");
    };
  }, []);

  return children;
}
