import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageSectionProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "muted" | "white";
  containerClassName?: string;
};

export function PageSection({
  children,
  className,
  variant = "default",
  containerClassName,
}: PageSectionProps) {
  return (
    <section
      className={cn(
        "page-section scroll-mt-[var(--header-height)]",
        variant === "muted" && "page-section-muted",
        variant === "white" && "page-section-white",
        className
      )}
    >
      <div className={cn("container-page", containerClassName)}>{children}</div>
    </section>
  );
}
