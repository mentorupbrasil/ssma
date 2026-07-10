import {
  Check,
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

const SCOPE_LAYOUT: Record<
  string,
  {
    status: string;
    points: string[];
    colSpan: 1 | 2;
    featured?: boolean;
  }
> = {
  "Medicina do Trabalho": {
    status: "Clínica",
    points: [
      "Exames admissionais, periódicos e demissionais",
      "ASO — Atestado de Saúde Ocupacional",
      "PCMSO e programas médicos",
      "Avaliações clínicas ocupacionais",
    ],
    colSpan: 2,
    featured: true,
  },
  "Segurança do Trabalho": {
    status: "Técnico",
    points: [
      "PGR — Gerenciamento de Riscos",
      "LTCAT e laudos técnicos",
      "Insalubridade e periculosidade",
    ],
    colSpan: 1,
  },
  "Documentação ocupacional": {
    status: "Conformidade",
    points: [
      "PCMSO, PGR, LTCAT e PPP",
      "Eventos de SST no eSocial",
      "Conformidade e organização documental",
    ],
    colSpan: 1,
  },
  "Portal e suporte ao RH": {
    status: "Digital",
    points: [
      "Encaminhamento digital de exames",
      "Acompanhamento de status em tempo real",
      "Central de documentos e histórico",
      "Suporte próximo ao RH",
    ],
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
          points: [],
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
            <div className="about-scope-card-top">
              <span className="about-scope-card-icon" aria-hidden>
                <Icon strokeWidth={1.75} />
              </span>
              <span className="about-scope-card-status">{layout.status}</span>
              <span className="about-scope-card-num" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="about-scope-card-main">
              <div className="about-scope-card-body">
                <h3 className="about-scope-card-title">{item.title}</h3>
                <p className="about-scope-card-desc">{item.text}</p>
              </div>

              {layout.points.length > 0 && (
                <ul
                  className="about-scope-card-list"
                  aria-label={`Entregáveis de ${item.title}`}
                >
                  {layout.points.map((point) => (
                    <li key={point}>
                      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
