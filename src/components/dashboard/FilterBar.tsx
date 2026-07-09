import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChips, type FilterChip } from "@/components/dashboard/FilterChips";
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
  activeChips?: FilterChip[];
  onRemoveChip?: (key: string) => void;
  onClearChips?: () => void;
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
  activeChips,
  onRemoveChip,
  onClearChips,
}: FilterBarProps) {
  return (
    <div className={cn("filter-bar-premium referral-filters", className)}>
      <div className={cn("referral-filters-grid", gridClassName)}>{children}</div>
      {(onSearch || onClear) && (
        <div className="referral-filters-actions flex flex-wrap items-center">
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
      {activeChips && activeChips.length > 0 && (
        <FilterChips chips={activeChips} onRemove={onRemoveChip} onClearAll={onClearChips} />
      )}
    </div>
  );
}
