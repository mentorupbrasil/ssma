import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EditorialHeroPill = {
  href: string;
  label: string;
  external?: boolean;
};

type EditorialHeroProps = {
  pill: EditorialHeroPill;
  title: string;
  description: string;
  badges?: readonly string[];
  badgesAriaLabel?: string;
  actions: ReactNode;
  className?: string;
};

function EditorialHeroPillLink({ pill }: { pill: EditorialHeroPill }) {
  const content = (
    <>
      <span>{pill.label}</span>
      <span className="editorial-hero-pill-divider" aria-hidden />
      <span className="editorial-hero-pill-icon" aria-hidden>
        <ArrowRight className="size-3" />
      </span>
    </>
  );

  if (pill.external || pill.href.startsWith("http")) {
    return (
      <a
        href={pill.href}
        target="_blank"
        rel="noopener noreferrer"
        className="editorial-hero-pill"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={pill.href} className="editorial-hero-pill">
      {content}
    </Link>
  );
}

export function EditorialHero({
  pill,
  title,
  description,
  badges,
  badgesAriaLabel = "Destaques",
  actions,
  className,
}: EditorialHeroProps) {
  return (
    <section className={cn("editorial-hero scroll-mt-[var(--header-height)]", className)}>
      <div className="editorial-hero-bg" aria-hidden />
      <div className="container-page editorial-hero-inner">
        <div className="editorial-hero-content animate-fade-up">
          <EditorialHeroPillLink pill={pill} />

          <h1 className="editorial-hero-title">{title}</h1>
          <p className="editorial-hero-desc">{description}</p>

          {badges && badges.length > 0 && (
            <div className="editorial-hero-badges" aria-label={badgesAriaLabel}>
              {badges.map((badge) => (
                <span key={badge} className="editorial-hero-badge">
                  {badge}
                </span>
              ))}
            </div>
          )}

          <div className="editorial-hero-actions">{actions}</div>
        </div>
      </div>
    </section>
  );
}
