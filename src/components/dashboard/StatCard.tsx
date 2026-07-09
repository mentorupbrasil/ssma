import type { LucideIcon } from "lucide-react";
import { MetricCard, type MetricCardVariant } from "./MetricCard";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  badge?: string;
  variant?: MetricCardVariant;
  className?: string;
};

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  badge,
  variant = "success",
  className,
}: StatCardProps) {
  const microcopy = [description, trend].filter(Boolean).join(" · ") || undefined;

  return (
    <MetricCard
      label={title}
      value={value}
      icon={icon}
      description={microcopy}
      badge={badge}
      variant={variant}
      className={cn("h-full", className)}
    />
  );
}
