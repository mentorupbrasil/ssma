import Link from "next/link";
import { cn } from "@/lib/utils";

type SiteBrandMarkProps = {
  /** Altura visual do símbolo, em pixels. O texto escala proporcionalmente. */
  height?: number;
  showLink?: boolean;
  href?: string;
  className?: string;
};

function BrandMarkIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <rect width="36" height="36" rx="10" fill="var(--brand-navy)" />
      <path
        d="M6.5 20H11L14.5 10.5L18.5 27.5L22.5 15.5H25.5H30"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28" cy="8.5" r="3.4" fill="var(--brand-green)" />
    </svg>
  );
}

/**
 * Wordmark do site público — substitui a logo raster antiga (cores
 * conflitantes) por um símbolo + tipografia consistentes com os tokens
 * de marca usados no restante do site.
 */
export function SiteBrandMark({
  height = 32,
  showLink = true,
  href = "/",
  className,
}: SiteBrandMarkProps) {
  const content = (
    <span className={cn("inline-flex shrink-0 items-center gap-2", className)}>
      <BrandMarkIcon size={height} />
      <span
        className="font-heading leading-none font-extrabold tracking-tight text-[var(--brand-navy)]"
        style={{ fontSize: height * 0.62 }}
      >
        Unimetra
      </span>
    </span>
  );

  if (!showLink) return content;

  return (
    <Link href={href} className="inline-flex items-center transition hover:opacity-90">
      {content}
    </Link>
  );
}
