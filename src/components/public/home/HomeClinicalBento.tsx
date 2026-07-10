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

const ADMISSIONAL_CHIPS = [
  "Antes do início das atividades",
  "Emissão de ASO",
  "Conforme NR-7 e PCMSO",
] as const;

type HomeClinicalBentoProps = {
  items: readonly ClinicalBentoItem[];
};

export function HomeClinicalBento({ items }: HomeClinicalBentoProps) {
  return (
    <ol className="home-clinical-bento">
      {items.map((exam, index) => {
        const Icon = EXAM_ICONS[exam.type] ?? Stethoscope;

        return (
          <li
            key={exam.type}
            className={cn(
              "home-clinical-bento-card",
              exam.highlight && "home-clinical-bento-card--featured"
            )}
          >
            <div className="home-clinical-bento-card-header">
              <span className="home-clinical-bento-card-icon" aria-hidden>
                <Icon strokeWidth={1.75} />
              </span>
              <div className="home-clinical-bento-card-head">
                <h3 className="home-clinical-bento-card-title">{exam.label}</h3>
                {exam.highlight && (
                  <span className="home-clinical-bento-card-flag">
                    <Star className="h-3 w-3" strokeWidth={2} aria-hidden />
                    Mais comum
                  </span>
                )}
              </div>
              <span className="home-clinical-bento-card-num" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="home-clinical-bento-card-desc">{exam.description}</p>
            {exam.highlight && (
              <ul className="home-clinical-bento-card-chips" aria-label="Destaques do exame admissional">
                {ADMISSIONAL_CHIPS.map((chip) => (
                  <li key={chip}>{chip}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
