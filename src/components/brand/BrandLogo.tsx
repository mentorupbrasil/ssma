import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const UNIMETRA_LOGO_SRC = "/brand/unimetra-logo.png";

type BrandLogoProps = {
  /** Altura visual da logo em pixels */
  height?: number;
  showLink?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  height = 36,
  showLink = true,
  href = "/",
  className,
  priority = false,
}: BrandLogoProps) {
  const width = Math.round(height * 4.1);

  const image = (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src={UNIMETRA_LOGO_SRC}
        alt="Unimetra — Medicina e Segurança do Trabalho"
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-auto object-contain"
        style={{ maxHeight: height, width: "auto" }}
      />
    </span>
  );

  if (!showLink) return image;

  return (
    <Link href={href} className="inline-flex transition hover:opacity-90">
      {image}
    </Link>
  );
}
