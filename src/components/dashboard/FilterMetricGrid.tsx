import type { LucideIcon } from "lucide-react";
import { MetricCard, type MetricCardVariant } from "@/components/dashboard/MetricCard";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { getMetricMeta } from "@/lib/metric-cards";

export type FilterMetricItem = {
  key: string;
  label: string;
  value: string | number;
  metaKey?: string;
  active?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
  description?: string;
  badge?: string;
  variant?: MetricCardVariant;
};

type FilterMetricGridProps = {
  items: FilterMetricItem[];
  className?: string;
};

export function FilterMetricGrid({ items, className }: FilterMetricGridProps) {
  return (
    <MetricGrid className={className}>
      {items.map((item) => {
        const meta = getMetricMeta(item.metaKey ?? item.key);
        return (
          <MetricCard
            key={item.key}
            label={item.label}
            value={item.value}
            icon={item.icon ?? meta.icon}
            description={item.description ?? meta.description}
            badge={item.badge ?? meta.badge}
            variant={item.variant ?? meta.tone}
            active={item.active}
            onClick={item.onClick}
          />
        );
      })}
    </MetricGrid>
  );
}
