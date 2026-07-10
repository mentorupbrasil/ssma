"use client";

import { useEffect } from "react";

export function AboutMotionRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("about-page-ready");
    return () => {
      document.documentElement.classList.remove("about-page-ready");
    };
  }, []);

  return <div className="about-page">{children}</div>;
}
