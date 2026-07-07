import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type FeatureCardProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  items?: string[];
  children?: ReactNode;
  className?: string;
  horizontal?: boolean;
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  items,
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
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="page-feature-card-title">{title}</h3>
        {description && <p className="page-feature-card-desc">{description}</p>}
        {items && items.length > 0 && (
          <ul className="page-feature-card-list">
            {items.map((item) => (
              <li key={item}>
                <Check className="page-feature-card-list-icon" strokeWidth={2.5} aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </div>
  );
}
