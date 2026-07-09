import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricCardVariant =
  | "neutral"
  | "positive"
  | "attention"
  | "critical"
  | "financial"
  | "operational";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  badge?: string;
  variant?: MetricCardVariant;
  active?: boolean;
  className?: string;
  onClick?: () => void;
};

const VARIANT_CLASS: Record<MetricCardVariant, string> = {
  neutral: "metric-card--neutral",
  positive: "metric-card--positive",
  attention: "metric-card--attention",
  critical: "metric-card--critical",
  financial: "metric-card--financial",
  operational: "metric-card--operational",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  badge,
  variant = "neutral",
  active,
  className,
  onClick,
}: MetricCardProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "metric-card w-full text-left",
        VARIANT_CLASS[variant],
        active && "metric-card-active",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="min-w-0 flex-1">
          <p className="metric-card-label">{label}</p>
          <p className="metric-card-value mt-1.5">{value}</p>
          {hint && <p className="metric-card-hint">{hint}</p>}
          {badge && <span className="metric-card-badge">{badge}</span>}
        </div>
        {Icon && (
          <div className="metric-card-icon shrink-0">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
        )}
      </div>
    </Tag>
  );
}
