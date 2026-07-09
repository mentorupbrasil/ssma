import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { cn } from "@/lib/utils";

type MetricCardSkeletonProps = {
  count?: number;
  className?: string;
};

export function MetricCardSkeleton({ count = 4, className }: MetricCardSkeletonProps) {
  return (
    <MetricGrid className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-[112px] flex-col rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="dash-skeleton h-10 w-10 rounded-full" />
            <div className="dash-skeleton h-4 w-12 rounded-full" />
          </div>
          <div className="dash-skeleton h-8 w-16" />
          <div className="dash-skeleton mt-2 h-4 w-28" />
          <div className="dash-skeleton mt-auto h-3 w-full pt-2" />
        </div>
      ))}
    </MetricGrid>
  );
}
