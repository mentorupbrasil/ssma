import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/dashboard/skeletons/TableSkeleton";
import type { LucideIcon } from "lucide-react";

type DataTableProps = {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: { label: string; onClick?: () => void; href?: string };
  skeletonRows?: number;
  skeletonCols?: number;
};

export function DataTable({
  children,
  className,
  loading,
  empty,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription,
  emptyIcon,
  emptyAction,
  skeletonRows = 6,
  skeletonCols = 5,
}: DataTableProps) {
  if (loading) {
    return <TableSkeleton rows={skeletonRows} cols={skeletonCols} className={className} />;
  }

  if (empty) {
    return (
      <div className={cn("dashboard-surface", className)}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          compact
          className="border-0 bg-transparent shadow-none"
        />
      </div>
    );
  }

  return (
    <div className={cn("dashboard-surface data-table-premium", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
