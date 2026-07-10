import {
  ArrowRightLeft,
  CalendarClock,
  LogOut,
  RotateCcw,
  Star,
  Stethoscope,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ClinicalBentoItem = {
  type: string;
  label: string;
  description: string;
  highlight?: boolean;
};

const EXAM_ICONS: Record<string, LucideIcon> = {
  ADMISSIONAL: UserPlus,
  PERIODICO: CalendarClock,
  DEMISSIONAL: LogOut,
  RETORNO_TRABALHO: RotateCcw,
  MUDANCA_FUNCAO: ArrowRightLeft,
  CONSULTA_OCUPACIONAL: Stethoscope,
};

const BENTO_PLACEMENT: Record<string, string> = {
  ADMISSIONAL: "home-clinical-bento-card--admissional",
  PERIODICO: "home-clinical-bento-card--periodico",
  DEMISSIONAL: "home-clinical-bento-card--demissional",
  RETORNO_TRABALHO: "home-clinical-bento-card--retorno",
  MUDANCA_FUNCAO: "home-clinical-bento-card--mudanca",
  CONSULTA_OCUPACIONAL: "home-clinical-bento-card--consulta",
};

type HomeClinicalBentoProps = {
  items: readonly ClinicalBentoItem[];
};

export function HomeClinicalBento({ items }: HomeClinicalBentoProps) {
  return (
    <ol className="home-clinical-bento">
      {items.map((exam, index) => {
        const Icon = EXAM_ICONS[exam.type] ?? Stethoscope;
        const placement = BENTO_PLACEMENT[exam.type] ?? "";

        return (
          <li
            key={exam.type}
            className={cn(
              "home-clinical-bento-card",
              placement,
              exam.highlight && "home-clinical-bento-card--featured"
            )}
          >
            <span className="home-clinical-bento-card-glow" aria-hidden />
            <div className="home-clinical-bento-card-top">
              <span className="home-clinical-bento-card-icon" aria-hidden>
                <Icon strokeWidth={1.75} />
              </span>
              <span className="home-clinical-bento-card-num" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="home-clinical-bento-card-body">
              <div className="home-clinical-bento-card-head">
                <h3 className="home-clinical-bento-card-title">{exam.label}</h3>
                {exam.highlight && (
                  <span className="home-clinical-bento-card-flag">
                    <Star className="h-3 w-3" strokeWidth={2} aria-hidden />
                    Mais comum
                  </span>
                )}
              </div>
              <p className="home-clinical-bento-card-desc">{exam.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
