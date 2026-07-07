import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CTASectionProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

function CtaLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function CTASection({
  title,
  description,
  primaryHref = "/contato?tipo=orcamento",
  primaryLabel = "Solicitar orçamento",
  secondaryHref = "/contato",
  secondaryLabel = "Falar com especialista",
  className,
}: CTASectionProps) {
  return (
    <section className={cn("final-cta-section scroll-mt-[var(--header-height)]", className)}>
      <div className="final-cta-section-glow" aria-hidden />
      <div className="container-page relative">
        <div className="final-cta-section-inner">
          <h2 className="final-cta-section-title">{title}</h2>
          <p className="final-cta-section-desc">{description}</p>
          <div className="final-cta-section-actions">
            <CtaLink href={primaryHref}>
              <Button variant="brand" size="lg" className="final-cta-btn-primary">
                {primaryLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CtaLink>
            <CtaLink href={secondaryHref}>
              <Button variant="outline-light" size="lg" className="final-cta-btn-secondary">
                {secondaryLabel}
              </Button>
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
