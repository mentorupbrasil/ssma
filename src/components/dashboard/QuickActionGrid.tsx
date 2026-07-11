import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickAction = {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
};

type QuickActionGridProps = {
  actions: QuickAction[];
  className?: string;
  variant?: "default" | "compact";
};

export function QuickActionGrid({
  actions,
  className,
  variant = "default",
}: QuickActionGridProps) {
  if (actions.length === 0) return null;

  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        isCompact
          ? "quick-actions-compact"
          : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {actions.map(({ href, label, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "quick-action-card group",
            isCompact && "quick-action-card--compact"
          )}
          title={isCompact ? description : undefined}
        >
          <span className="quick-action-card-icon">
            <Icon className={cn(isCompact ? "h-3.5 w-3.5" : "h-5 w-5")} strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span
              className={cn(
                "block font-semibold tracking-tight text-[var(--brand-navy)]",
                isCompact ? "text-xs" : "text-sm font-bold"
              )}
            >
              {label}
            </span>
            {description && !isCompact && (
              <span className="mt-0.5 block text-xs leading-relaxed text-[var(--dash-text-muted)]">
                {description}
              </span>
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}
