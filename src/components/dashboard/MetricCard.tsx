import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  normalizeMetricTone,
  type LegacyMetricVariant,
  type MetricTone,
} from "@/lib/metric-cards";

export type MetricCardVariant = MetricTone | LegacyMetricVariant;

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  /** @deprecated use description */
  hint?: string;
  badge?: string;
  variant?: MetricCardVariant;
  active?: boolean;
  className?: string;
  onClick?: () => void;
};

const TONE_STYLES: Record<
  MetricTone,
  { shell: string; icon: string; badge: string; active: string }
> = {
  default: {
    shell: "border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50/90",
    icon: "bg-slate-100 text-slate-600",
    badge: "bg-slate-100 text-slate-600",
    active: "border-slate-300 ring-2 ring-slate-400/15",
  },
  success: {
    shell: "border-emerald-100/90 bg-gradient-to-br from-white via-white to-emerald-50/50",
    icon: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
    active: "border-emerald-300/70 ring-2 ring-emerald-500/15",
  },
  warning: {
    shell: "border-amber-100/90 bg-gradient-to-br from-white via-white to-amber-50/40",
    icon: "bg-amber-50 text-amber-600",
    badge: "bg-amber-50 text-amber-700",
    active: "border-amber-300/70 ring-2 ring-amber-500/15",
  },
  danger: {
    shell: "border-red-100/90 bg-gradient-to-br from-white via-white to-red-50/35",
    icon: "bg-red-50 text-red-600",
    badge: "bg-red-50 text-red-700",
    active: "border-red-300/70 ring-2 ring-red-500/15",
  },
  info: {
    shell: "border-indigo-100/80 bg-gradient-to-br from-white via-white to-indigo-50/35",
    icon: "bg-indigo-50 text-indigo-600",
    badge: "bg-indigo-50 text-indigo-700",
    active: "border-indigo-300/70 ring-2 ring-indigo-500/15",
  },
  finance: {
    shell: "border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-100/60",
    icon: "bg-slate-100 text-[var(--brand-navy,#0f3d4a)]",
    badge: "bg-slate-100 text-[var(--brand-navy,#0f3d4a)]",
    active: "border-slate-300 ring-2 ring-slate-500/12",
  },
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  description,
  hint,
  badge,
  variant = "default",
  active,
  className,
  onClick,
}: MetricCardProps) {
  const tone = normalizeMetricTone(variant);
  const styles = TONE_STYLES[tone];
  const microcopy = description ?? hint;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative flex w-full min-h-[112px] flex-col rounded-2xl border p-5 text-left",
        "shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.09)]",
        styles.shell,
        active && cn("shadow-[0_16px_40px_rgba(15,23,42,0.09)]", styles.active),
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        {Icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              styles.icon
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
        ) : (
          <span className="h-10 w-10 shrink-0" aria-hidden />
        )}
        {badge && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
              styles.badge
            )}
          >
            {badge}
          </span>
        )}
      </div>

      <p
        className={cn(
          "font-extrabold tracking-tight text-slate-900",
          typeof value === "string" && value.length > 14
            ? "text-base font-semibold leading-snug"
            : "text-[1.75rem] leading-none"
        )}
      >
        {value}
      </p>

      <p className="mt-2 text-sm font-medium leading-snug text-slate-700">{label}</p>

      {microcopy && (
        <p className="mt-auto pt-2.5 text-xs leading-relaxed text-slate-500">{microcopy}</p>
      )}
    </Tag>
  );
}
