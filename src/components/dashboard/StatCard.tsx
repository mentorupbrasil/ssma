import type { LucideIcon } from "lucide-react";
import { MetricCard, type MetricCardVariant } from "./MetricCard";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  variant?: MetricCardVariant;
  className?: string;
};

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = "positive",
  className,
}: StatCardProps) {
  const hint = [description, trend].filter(Boolean).join(" · ") || undefined;

  return (
    <MetricCard
      label={title}
      value={value}
      icon={icon}
      hint={hint}
      variant={variant}
      className={cn("h-full", className)}
    />
  );
}
