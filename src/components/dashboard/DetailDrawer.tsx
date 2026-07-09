"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASS = {
  md: "sm:max-w-md",
  lg: "sm:max-w-xl",
  xl: "sm:max-w-2xl",
};

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  loading,
  error,
  children,
  footer,
  size = "lg",
  className,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          "detail-drawer flex w-full flex-col gap-0 overflow-hidden p-0",
          SIZE_CLASS[size],
          className
        )}
      >
        <SheetHeader className="detail-drawer-header shrink-0 border-b border-[var(--dash-border)] px-5 py-4">
          <SheetTitle className="text-left text-base font-bold text-[var(--brand-navy)]">
            {title}
          </SheetTitle>
          {description && (
            <SheetDescription className="text-left text-sm">{description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="detail-drawer-body min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
            </div>
          ) : error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : (
            children
          )}
        </div>

        {footer && !loading && (
          <div className="detail-drawer-footer shrink-0 border-t border-[var(--dash-border)] bg-slate-50/80 px-5 py-3">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
