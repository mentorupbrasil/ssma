import Image from "next/image";

import { cn } from "@/lib/utils";

type AboutBrandFrameProps = {
  image?: string | null;
  alt: string;
  variant?: "hero" | "gallery-primary" | "gallery-a" | "gallery-b" | "team-medicina" | "team-examinador" | "team-sst" | "team-rh";
  className?: string;
  badge?: string;
  caption?: string;
};

function BrandPulseMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 48"
      fill="none"
      aria-hidden
      className={cn("about-brand-pulse", className)}
    >
      <path
        d="M4 28H22L34 10L48 38L62 18L76 28H116"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrandSymbol({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden className={className}>
      <rect width="36" height="36" rx="10" fill="currentColor" fillOpacity="0.12" />
      <path
        d="M6.5 20H11L14.5 10.5L18.5 27.5L22.5 15.5H25.5H30"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28" cy="8.5" r="3.2" fill="var(--brand-green)" />
    </svg>
  );
}

export function AboutBrandFrame({
  image,
  alt,
  variant = "hero",
  className,
  badge,
  caption,
}: AboutBrandFrameProps) {
  if (image) {
    return (
      <div className={cn("about-brand-frame about-brand-frame--photo", `about-brand-frame--${variant}`, className)}>
        <Image src={image} alt={alt} fill className="about-brand-frame-img" sizes="(max-width: 768px) 100vw, 50vw" priority={variant === "hero"} />
        {badge ? <span className="about-brand-frame-badge">{badge}</span> : null}
      </div>
    );
  }

  return (
    <div className={cn("about-brand-frame", `about-brand-frame--${variant}`, className)} aria-hidden={variant.startsWith("team-")}>
      <div className="about-brand-frame-base" />
      <div className="about-brand-frame-texture" />
      <div className="about-brand-frame-accent" />
      <BrandSymbol className="about-brand-frame-symbol" />
      <BrandPulseMark className="about-brand-frame-pulse" />
      {badge ? <span className="about-brand-frame-badge">{badge}</span> : null}
      {caption ? <p className="about-brand-frame-caption">{caption}</p> : null}
    </div>
  );
}
