import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  preparoSlug,
  highlights,
  showDetailsLink,
  icon,
  className,
}: ServiceFeatureCardProps) {
  const Icon = icon ?? getServiceIcon(name);
  const preparoHref = preparoSlug
    ? `/exames?exame=${encodeURIComponent(preparoSlug)}`
    : null;
  const detailsHref = showDetailsLink
    ? `/contato?servico=${encodeURIComponent(name)}`
    : null;
  const discreetHref = preparoHref ?? detailsHref;
  const discreetLabel = preparoHref ? "Ver preparo do exame" : "Ver detalhes";

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

      {discreetHref && (
        <Link href={discreetHref} className="service-feature-card-link">
          {discreetLabel}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </Link>
      )}
    </article>
  );
}
