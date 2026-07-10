import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getServiceIcon } from "@/lib/service-icons";
import type { ServiceItem } from "@/data/services";

type ServiceFeatureCardProps = ServiceItem & {
  icon?: LucideIcon;
  className?: string;
};

export function ServiceFeatureCard({
  name,
  description,
  badge,
  highlights,
  icon,
  className,
}: ServiceFeatureCardProps) {
  const Icon = icon ?? getServiceIcon(name);

  return (
    <article className={cn("service-feature-card group", className)}>
      <div className="service-feature-card-accent" aria-hidden />
      <div className="service-feature-card-hover" aria-hidden />

      <div className="service-feature-card-top">
        <div className="service-feature-card-icon" aria-hidden>
          <Icon strokeWidth={1.75} />
        </div>
        {badge && <span className="service-feature-card-badge">{badge}</span>}
      </div>

      <h3 className="service-feature-card-title">{name}</h3>
      <p className="service-feature-card-desc">{description}</p>

      {highlights && highlights.length > 0 && (
        <ul className="service-feature-card-highlights">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
