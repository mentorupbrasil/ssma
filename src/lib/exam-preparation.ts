import type { ExamGuide, PreparationStatus } from "@/data/exams";

export const PREPARATION_STATUS_LABELS: Record<PreparationStatus, string> = {
  SEM_PREPARO: "Sem preparo específico",
  PREPARO_NECESSARIO: "Preparo necessário",
  JEJUM_NECESSARIO: "Jejum necessário",
  ATENCAO_ESPECIAL: "Atenção especial",
  VERIFICAR_EXAME: "Verificar exame solicitado",
  ORIENTACAO_ESPECIFICA: "Orientação específica",
};

export const DISPLAY_CATEGORY_LABELS: Record<ExamGuide["displayCategory"], string> = {
  COMPLEMENTAR: "Complementar",
  LABORATORIAL: "Laboratorial",
  IMAGEM: "Imagem",
  TOXICOLOGICO: "Toxicológico",
};

export type ExamFilterId =
  | "all"
  | "sem-preparo"
  | "jejum"
  | "resultado-dia"
  | "complementar"
  | "laboratorial"
  | "imagem"
  | "toxicologico";

export const EXAM_FILTER_OPTIONS: { id: ExamFilterId; label: string }[] = [
  { id: "all", label: "Todas as categorias" },
  { id: "sem-preparo", label: "Sem preparo" },
  { id: "jejum", label: "Jejum necessário" },
  { id: "resultado-dia", label: "Resultado no dia" },
  { id: "complementar", label: "Complementar" },
  { id: "laboratorial", label: "Laboratorial" },
  { id: "imagem", label: "Imagem" },
  { id: "toxicologico", label: "Toxicológico" },
];

export function filterExamGuides(
  exams: ExamGuide[],
  search: string,
  filter: ExamFilterId
): ExamGuide[] {
  const query = search.trim().toLowerCase();

  return exams.filter((exam) => {
    const matchSearch =
      !query ||
      exam.name.toLowerCase().includes(query) ||
      exam.slug.toLowerCase().includes(query.replace(/\s+/g, "-"));

    if (!matchSearch) return false;
    if (filter === "all") return true;

    switch (filter) {
      case "sem-preparo":
        return exam.preparationStatus === "SEM_PREPARO";
      case "jejum":
        return (
          exam.preparationStatus === "JEJUM_NECESSARIO" ||
          exam.preparationBefore.toLowerCase().includes("jejum")
        );
      case "resultado-dia":
        return exam.deliveryTime.toLowerCase().includes("no dia");
      case "complementar":
        return exam.displayCategory === "COMPLEMENTAR";
      case "laboratorial":
        return exam.displayCategory === "LABORATORIAL";
      case "imagem":
        return exam.displayCategory === "IMAGEM";
      case "toxicologico":
        return exam.displayCategory === "TOXICOLOGICO";
      default:
        return true;
    }
  });
}

export function buildWhatsAppShareMessage(exam: ExamGuide): string {
  return `Olá! Seguem as orientações para o exame ${exam.name}:

Preparo: ${exam.preparationBefore}
Prazo médio: ${exam.deliveryTime}
Observações: ${exam.notes ?? "—"}

Em caso de dúvidas, fale com a clínica.`;
}

export function buildCopyText(exam: ExamGuide): string {
  return `${exam.name}

Preparo antes do exame:
${exam.preparationBefore}

No dia do exame:
${exam.preparationOnDay}

Prazo médio de entrega:
${exam.deliveryTime}

Observações importantes:
${exam.notes ?? "—"}

Quando informar a clínica:
${exam.whenToInformClinic}`;
}

export async function copyExamInstructions(exam: ExamGuide): Promise<void> {
  await navigator.clipboard.writeText(buildCopyText(exam));
}
