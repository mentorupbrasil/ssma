import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  CalendarClock,
  RotateCcw,
  UserMinus,
  UserPlus,
} from "lucide-react";

export const EXAMS_HERO_BADGES = [
  "Preparo por exame",
  "Prazos médios",
  "Exames ocupacionais",
  "Orientações para empresas",
] as const;

export const CLINICAL_EXAM_ICONS: Record<string, LucideIcon> = {
  ADMISSIONAL: UserPlus,
  PERIODICO: CalendarClock,
  DEMISSIONAL: UserMinus,
  RETORNO_TRABALHO: RotateCcw,
  MUDANCA_FUNCAO: ArrowRightLeft,
};
