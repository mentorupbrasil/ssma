import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  children: React.ReactNode;
  onSearch?: () => void;
  onClear?: () => void;
  isPending?: boolean;
  searchLabel?: string;
  clearLabel?: string;
  className?: string;
  gridClassName?: string;
};

export function FilterBar({
  children,
  onSearch,
  onClear,
  isPending = false,
  searchLabel = "Filtrar",
  clearLabel = "Limpar filtros",
  className,
  gridClassName,
}: FilterBarProps) {
  return (
    <div className={cn("referral-filters dashboard-surface", className)}>
      <div className={cn("referral-filters-grid", gridClassName)}>{children}</div>
      {(onSearch || onClear) && (
        <div className="referral-filters-actions">
          {onSearch && (
            <Button variant="brand" size="sm" onClick={onSearch} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : searchLabel}
            </Button>
          )}
          {onClear && (
            <Button variant="outline" size="sm" onClick={onClear}>
              {clearLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
