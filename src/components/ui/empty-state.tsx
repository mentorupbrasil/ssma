import type { LucideIcon } from "lucide-react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "brand" | "outline" | "destructive";
};

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  compact?: boolean;
};

function EmptyStateActionButton({ action }: { action: EmptyStateAction }) {
  const variant = action.variant ?? "brand";

  if (action.href) {
    return (
      <a href={action.href} className="inline-flex">
        <Button variant={variant}>{action.label}</Button>
      </a>
    );
  }

  return (
    <Button variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "empty-state-premium flex flex-col items-center justify-center",
        compact ? "px-6 py-10" : "px-8 py-16",
        className
      )}
    >
      <div className="empty-state-premium-icon">
        <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </div>
      <h3 className="empty-state-premium-title mt-5">{title}</h3>
      {description && (
        <p className="empty-state-premium-desc mt-2 max-w-md">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {secondaryAction && <EmptyStateActionButton action={secondaryAction} />}
          {action && <EmptyStateActionButton action={action} />}
        </div>
      )}
    </div>
  );
}
