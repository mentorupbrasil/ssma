import Link from "next/link";
import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AboutCtaLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  external?: boolean;
};

export function AboutCtaLink({
  href,
  children,
  className,
  variant = "brand",
  size = "default",
  external,
}: AboutCtaLinkProps) {
  const isExternal = external ?? href.startsWith("http");
  const classes = cn(buttonVariants({ variant, size }), "gap-2 rounded-xl", className);

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
