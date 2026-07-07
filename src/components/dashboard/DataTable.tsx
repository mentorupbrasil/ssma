import { cn } from "@/lib/utils";

type DataTableProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={cn("dashboard-surface", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
