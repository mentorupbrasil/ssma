import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ServiceCardCtaVariant = "clinical" | "technical" | "exam";

type ServiceCardProps = {
  name: string;
  description: string;
  audience?: string;
  deliveryTime?: string;
  badge?: string;
  preparoSlug?: string;
  icon?: LucideIcon;
  ctaVariant?: ServiceCardCtaVariant;
  className?: string;
};

export function ServiceCard({
  name,
  description,
  audience,
  deliveryTime,
  badge,
  preparoSlug,
  icon: Icon,
  ctaVariant = "clinical",
  className,
}: ServiceCardProps) {
  const isTechnical = ctaVariant === "technical";
  const isExam = ctaVariant === "exam";
  const proposalHref = `/contato?tipo=orcamento&servico=${encodeURIComponent(name)}`;
  const detailsHref = `/contato?servico=${encodeURIComponent(name)}`;
  const preparoHref = preparoSlug
    ? `/exames?exame=${encodeURIComponent(preparoSlug)}`
    : "/exames";

  return (
    <article
      className={cn(
        "service-card group",
        isTechnical && "service-card--technical",
        isExam && "service-card--exam",
        className
      )}
    >
      <div className="service-card-header">
        {Icon && (
          <div className="service-card-icon" aria-hidden>
            <Icon strokeWidth={1.75} />
          </div>
        )}
        {badge && <span className="service-card-badge">{badge}</span>}
      </div>
      <h3 className="service-card-title">{name}</h3>
      <p className="service-card-desc">{description}</p>
      {(audience || deliveryTime) && (
        <dl className="service-card-meta">
          {audience && (
            <div className="service-card-meta-row">
              <dt>Indicado para</dt>
              <dd>{audience}</dd>
            </div>
          )}
          {deliveryTime && (
            <div className="service-card-meta-row">
              <dt>Prazo médio</dt>
              <dd>{deliveryTime}</dd>
            </div>
          )}
        </dl>
      )}
      {isExam && (
        <Link href={preparoHref} className="service-card-preparo-link">
          Ver preparo do exame
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      )}
      <div className="service-card-actions">
        {isTechnical ? (
          <>
            <Link href={proposalHref} className="service-card-action-link">
              <Button size="sm" variant="brand" className="service-card-btn w-full rounded-lg">
                Solicitar proposta
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href={detailsHref} className="service-card-action-link">
              <Button size="sm" variant="outline" className="service-card-btn w-full rounded-lg">
                Ver detalhes
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link href="/encaminhamento-online" className="service-card-action-link">
              <Button size="sm" variant="brand" className="service-card-btn w-full rounded-lg">
                Fazer encaminhamento
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/contato?tipo=orcamento" className="service-card-action-link">
              <Button size="sm" variant="outline" className="service-card-btn w-full rounded-lg">
                Solicitar orçamento
              </Button>
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
