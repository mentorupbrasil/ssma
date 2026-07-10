import type { LucideIcon } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type AboutMediaFallbackProps = {
  icon: LucideIcon;
  monogram?: string;
  image?: string | null;
  alt?: string;
  className?: string;
  variant?: "hero" | "structure" | "team";
  accent?: "a" | "b" | "c" | "d";
};

export function AboutMediaFallback({
  icon: Icon,
  monogram,
  image,
  alt = "",
  className,
  variant = "structure",
  accent = "a",
}: AboutMediaFallbackProps) {
  if (image) {
    return (
      <div className={cn("about-ed-media about-ed-media--photo", className)}>
        <Image
          src={image}
          alt={alt}
          fill
          className="about-ed-media-photo"
          sizes={
            variant === "team"
              ? "(max-width: 768px) 100vw, 280px"
              : "(max-width: 768px) 100vw, 400px"
          }
        />
      </div>
    );
  }

  const showMonogram = Boolean(monogram) && variant !== "team";

  return (
    <div
      className={cn(
        "about-ed-media",
        `about-ed-media--${variant}`,
        `about-ed-media--accent-${accent}`,
        className
      )}
      aria-hidden={variant !== "team"}
    >
      <div className="about-ed-media-gradient" aria-hidden />
      <div className="about-ed-media-lines" aria-hidden />
      <span className="about-ed-media-icon-wrap">
        {showMonogram ? (
          <span className="about-ed-media-monogram">{monogram}</span>
        ) : (
          <Icon strokeWidth={1.5} aria-hidden />
        )}
      </span>
    </div>
  );
}
