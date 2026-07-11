"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Badge = { label: string; variant?: "category" | "status" };

type SystemModalShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  badges?: Badge[];
  children: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
};

export function SystemModalField({
  label,
  required,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "exam-modal-item exam-modal-item--wide" : "exam-modal-item"}>
      <label className="exam-modal-item-label">
        {label}
        {required ? " *" : ""}
      </label>
      <div className="collaborator-modal-field">{children}</div>
    </div>
  );
}

export function SystemModalShell({
  open,
  onOpenChange,
  title,
  description,
  badges = [],
  children,
  footer,
  className,
}: SystemModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("exam-modal collaborator-modal", className)}
        showCloseButton
      >
        <header className="exam-modal-head">
          {badges.length > 0 && (
            <div className="exam-modal-head-top">
              <div className="exam-drawer-badges">
                {badges.map((badge) => (
                  <span
                    key={badge.label}
                    className={
                      badge.variant === "status"
                        ? "exam-drawer-badge exam-drawer-badge--status"
                        : "exam-drawer-badge exam-drawer-badge--category"
                    }
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          <DialogTitle className="exam-modal-title">{title}</DialogTitle>
          {description && (
            <DialogDescription className="collaborator-modal-subtitle">
              {description}
            </DialogDescription>
          )}
        </header>

        <div className="exam-modal-grid collaborator-modal-grid">{children}</div>

        <footer className="exam-modal-footer collaborator-modal-footer">{footer}</footer>
      </DialogContent>
    </Dialog>
  );
}
