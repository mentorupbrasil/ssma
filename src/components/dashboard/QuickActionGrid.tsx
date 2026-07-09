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
};

export function QuickActionGrid({ actions, className }: QuickActionGridProps) {
  if (actions.length === 0) return null;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {actions.map(({ href, label, description, icon: Icon }) => (
        <Link key={href} href={href} className="quick-action-card group">
          <span className="quick-action-card-icon">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold tracking-tight text-[var(--brand-navy)]">
              {label}
            </span>
            {description && (
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
