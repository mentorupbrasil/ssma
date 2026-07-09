import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricGridProps = {
  children: ReactNode;
  className?: string;
};

export function MetricGrid({ children, className }: MetricGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3",
        "lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]",
        className
      )}
    >
      {children}
    </div>
  );
}
