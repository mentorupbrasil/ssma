import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileListCardProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  className?: string;
  children?: React.ReactNode;
};

export function MobileListCard({
  title,
  subtitle,
  meta,
  badge,
  icon: Icon,
  onClick,
  href,
  className,
  children,
}: MobileListCardProps) {
  const inner = (
    <>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mobile-list-card-icon">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--brand-navy)]">{title}</p>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--dash-text-muted)]">{subtitle}</p>
          )}
          {meta && (
            <p className="mt-1 text-[0.6875rem] text-[var(--dash-text-subtle)]">{meta}</p>
          )}
          {children}
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dash-text-subtle)]" />
      </div>
    </>
  );

  const classes = cn("mobile-list-card", className);

  if (href) {
    return (
      <a href={href} className={classes}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(classes, "w-full text-left")}>
      {inner}
    </button>
  );
}
