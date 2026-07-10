import {
  FileCheck,
  HardHat,
  Monitor,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";
import type { AboutDeliverableItem } from "@/data/about";

const SCOPE_ICONS: Record<string, LucideIcon> = {
  "Medicina do Trabalho": Stethoscope,
  "Segurança do Trabalho": HardHat,
  "Documentação ocupacional": FileCheck,
  "Portal e suporte ao RH": Monitor,
};

const SCOPE_LAYOUT: Record<
  string,
  {
    status: string;
    tags: string[];
    colSpan: 1 | 2;
    featured?: boolean;
  }
> = {
  "Medicina do Trabalho": {
    status: "Clínica",
    tags: ["ASO", "Exames", "PCMSO"],
    colSpan: 2,
    featured: true,
  },
  "Segurança do Trabalho": {
    status: "Técnico",
    tags: ["PGR", "Laudos", "SST"],
    colSpan: 1,
  },
  "Documentação ocupacional": {
    status: "Conformidade",
    tags: ["PCMSO", "PPP", "Eventos"],
    colSpan: 1,
  },
  "Portal e suporte ao RH": {
    status: "Digital",
    tags: ["Encaminhamentos", "Status", "RH"],
    colSpan: 2,
  },
};

type AboutScopeBentoProps = {
  items: AboutDeliverableItem[];
};

export function AboutScopeBento({ items }: AboutScopeBentoProps) {
  return (
    <ol className="about-scope-bento">
      {items.map((item, index) => {
        const Icon = SCOPE_ICONS[item.title] ?? Stethoscope;
        const layout = SCOPE_LAYOUT[item.title] ?? {
          status: "Atuação",
          tags: [],
          colSpan: 1 as const,
        };
        const featured = layout.featured ?? false;

        return (
          <li
            key={item.title}
            className={cn(
              "about-scope-card group",
              layout.colSpan === 2 && "about-scope-card--wide",
              featured && "about-scope-card--featured"
            )}
          >
            <div className="about-scope-card-pattern" aria-hidden />
            {featured ? (
              <GlowingEffect
                spread={38}
                glow
                disabled={false}
                proximity={72}
                inactiveZone={0.01}
                borderWidth={2}
              />
            ) : (
              <div className="about-scope-card-glow" aria-hidden />
            )}

            <div className="about-scope-card-top">
              <span className="about-scope-card-icon" aria-hidden>
                <Icon strokeWidth={1.75} />
              </span>
              <span className="about-scope-card-status">{layout.status}</span>
            </div>

            <div className="about-scope-card-body">
              <div className="about-scope-card-head">
                <h3 className="about-scope-card-title">{item.title}</h3>
                <span className="about-scope-card-num" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="about-scope-card-desc">{item.text}</p>
            </div>

            {layout.tags.length > 0 && (
              <ul className="about-scope-card-tags" aria-label={`Áreas de ${item.title}`}>
                {layout.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
