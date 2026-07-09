import { cn } from "@/lib/utils";

type MetricCardSkeletonProps = {
  count?: number;
  className?: string;
};

export function MetricCardSkeleton({ count = 4, className }: MetricCardSkeletonProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="metric-card metric-card--neutral pl-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="dash-skeleton h-3 w-20" />
              <div className="dash-skeleton h-7 w-14" />
            </div>
            <div className="dash-skeleton h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
