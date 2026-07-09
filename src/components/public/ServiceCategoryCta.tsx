import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ServiceCategoryCta } from "@/data/services";
import { cn } from "@/lib/utils";

type ServiceCategoryCtaProps = {
  cta: ServiceCategoryCta;
  whatsappHref?: string;
  className?: string;
};

export function ServiceCategoryCtaBlock({
  cta,
  whatsappHref,
  className,
}: ServiceCategoryCtaProps) {
  const primaryHref =
    cta.primaryHref === "whatsapp" && whatsappHref ? whatsappHref : cta.primaryHref;
  const isPrimaryExternal = primaryHref.startsWith("http");

  return (
    <aside className={cn("service-category-cta", className)}>
      <p className="service-category-cta-text">{cta.text}</p>
      <div className="service-category-cta-actions">
        {isPrimaryExternal ? (
          <a href={primaryHref} target="_blank" rel="noopener noreferrer">
            <Button variant="brand" size="sm" className="rounded-xl">
              {cta.primaryLabel}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </a>
        ) : (
          <Link href={primaryHref}>
            <Button variant="brand" size="sm" className="rounded-xl">
              {cta.primaryLabel}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
        {cta.secondaryLabel && cta.secondaryHref && (
          <Link href={cta.secondaryHref} className="service-category-cta-secondary">
            {cta.secondaryLabel}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        )}
      </div>
    </aside>
  );
}
