import { cn } from "@/lib/utils";

type TableSkeletonProps = {
  rows?: number;
  cols?: number;
  className?: string;
};

export function TableSkeleton({ rows = 5, cols = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("dashboard-surface data-table-premium p-4", className)}>
      <div className="mb-3 flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="dash-skeleton h-3 flex-1" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-3 py-2">
            {Array.from({ length: cols }).map((_, col) => (
              <div
                key={col}
                className={cn("dash-skeleton h-4 flex-1", col === 0 && "max-w-[40%]")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
