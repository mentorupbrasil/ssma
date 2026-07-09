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
        <Link
          key={href}
          href={href}
          className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[var(--brand-green)]/35 hover:shadow-md"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[var(--brand-green)] transition group-hover:bg-[var(--brand-green)] group-hover:text-white">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[var(--brand-navy)]">{label}</span>
            {description && (
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}
