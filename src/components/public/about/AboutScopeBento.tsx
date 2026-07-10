import {
  FileCheck,
  HardHat,
  Monitor,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AboutDeliverableItem } from "@/data/about";

const SCOPE_ICONS: Record<string, LucideIcon> = {
  "Medicina do Trabalho": Stethoscope,
  "Segurança do Trabalho": HardHat,
  "Documentação ocupacional": FileCheck,
  "Portal e suporte ao RH": Monitor,
};

type AboutScopeBentoProps = {
  items: AboutDeliverableItem[];
};

export function AboutScopeBento({ items }: AboutScopeBentoProps) {
  return (
    <ol className="home-clinical-bento about-scope-bento">
      {items.map((item, index) => {
        const Icon = SCOPE_ICONS[item.title] ?? Stethoscope;
        const featured = item.layout === "featured";

        return (
          <li
            key={item.title}
            className={cn(
              "home-clinical-bento-card",
              featured && "home-clinical-bento-card--featured"
            )}
          >
            <div className="home-clinical-bento-card-header">
              <span className="home-clinical-bento-card-icon" aria-hidden>
                <Icon strokeWidth={1.75} />
              </span>
              <div className="home-clinical-bento-card-head">
                <h3 className="home-clinical-bento-card-title">{item.title}</h3>
              </div>
              <span className="home-clinical-bento-card-num" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="home-clinical-bento-card-desc">{item.text}</p>
          </li>
        );
      })}
    </ol>
  );
}
