"use client";

import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SystemActionItem = {
  label: string;
  hint?: string;
  icon: LucideIcon;
  iconTone?: "view" | "schedule" | "docs" | "quote" | "portal" | "progress" | "done" | "cancel";
  onClick: () => void;
  disabled?: boolean;
};

type SystemActionMenuProps = {
  items: SystemActionItem[];
  align?: "start" | "center" | "end";
  className?: string;
};

export function SystemActionMenu({
  items,
  align = "end",
  className,
}: SystemActionMenuProps) {
  if (items.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "empresas-clinica-action-btn h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            aria-label="Mais ações"
            title="Mais ações"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent
        className="collaborator-action-menu w-60 p-1.5"
        align={align}
        sideOffset={6}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const tone = item.iconTone ?? "view";
          return (
            <button
              key={item.label}
              type="button"
              className="collaborator-action-item"
              disabled={item.disabled}
              onClick={item.onClick}
            >
              <span className={`collaborator-action-icon collaborator-action-icon--${tone}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="collaborator-action-label">{item.label}</span>
                {item.hint && (
                  <span className="collaborator-action-hint">{item.hint}</span>
                )}
              </span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
