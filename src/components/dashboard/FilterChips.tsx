"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterChip = {
  key: string;
  label: string;
};

type FilterChipsProps = {
  chips: FilterChip[];
  onRemove?: (key: string) => void;
  onClearAll?: () => void;
  className?: string;
};

export function FilterChips({ chips, onRemove, onClearAll, className }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={cn("filter-chips", className)}>
      {chips.map((chip) => (
        <span key={chip.key} className="filter-chip">
          {chip.label}
          {onRemove && (
            <button
              type="button"
              className="filter-chip-remove"
              aria-label={`Remover filtro ${chip.label}`}
              onClick={() => onRemove(chip.key)}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          className="text-xs font-semibold text-[var(--brand-green)] hover:underline"
          onClick={onClearAll}
        >
          Limpar todos
        </button>
      )}
    </div>
  );
}
