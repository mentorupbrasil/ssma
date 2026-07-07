import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type FeatureCardProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  horizontal?: boolean;
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  horizontal = false,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "page-feature-card group",
        horizontal && "page-feature-card-horizontal",
        className
      )}
    >
      {Icon && (
        <div className="page-feature-card-icon">
          <Icon strokeWidth={1.75} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="page-feature-card-title">{title}</h3>
        {description && <p className="page-feature-card-desc">{description}</p>}
        {children}
      </div>
    </div>
  );
}
