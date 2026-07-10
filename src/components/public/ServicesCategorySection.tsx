"use client";

import { ServiceFeatureCard } from "@/components/public/ServiceFeatureCard";
import { ServiceCategoryCtaBlock } from "@/components/public/ServiceCategoryCta";
import type { ServiceCategory } from "@/data/services";
import { cn } from "@/lib/utils";

type ServicesCategorySectionProps = {
  category: ServiceCategory;
  index: number;
  whatsappHref: string;
};

export function ServicesCategorySection({
  category,
  index,
  whatsappHref,
}: ServicesCategorySectionProps) {
  const isAlt = index % 2 === 1;
  const count = category.services.length;

  return (
    <section
      id={category.id}
      className={cn(
        "services-category scroll-mt-[calc(var(--header-height)+3.5rem)]",
        isAlt && "services-category--alt",
        category.id === "seguranca-trabalho" && "services-category--safety",
        category.id === "exames-complementares" && "services-category--exams",
        category.id === "documentacao" && "services-category--docs"
      )}
    >
      <div className="container-page">
        <header className="services-category-header">
          <p className="services-category-eyebrow">Serviços</p>
          <h2 className="services-category-title">{category.title}</h2>
          {category.description && (
            <p className="services-category-desc">{category.description}</p>
          )}
          {category.contextLine && (
            <p className="services-category-context">{category.contextLine}</p>
          )}
        </header>

        <div
          className="service-features-grid"
          data-rem-lg={count % 3}
          data-rem-md={count % 2}
        >
          {category.services.map((service) => (
            <ServiceFeatureCard key={service.name} {...service} />
          ))}
        </div>

        {category.cta && (
          <ServiceCategoryCtaBlock
            cta={category.cta}
            whatsappHref={whatsappHref}
            className="services-category-cta-wrap"
          />
        )}
      </div>
    </section>
  );
}
