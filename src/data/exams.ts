import { ExamCategory } from "@prisma/client";

export type ExamData = {
  name: string;
  slug: string;
  category: ExamCategory;
  preparation: string;
  deliveryTime: string;
  notes?: string;
};

export const INITIAL_EXAMS: ExamData[] = [
  {
    name: "Audiometria",
    slug: "audiometria",
    category: "COMPLEMENTAR",
    preparation: "Repouso acústico de 14 horas. Evitar ruídos fortes e uso de fones.",
    deliveryTime: "No dia do exame",
    notes: "Importante para trabalhadores expostos a ruído.",
  },
  {
    name: "Avaliação psicológica",
    slug: "avaliacao-psicologica",
    category: "COMPLEMENTAR",
    preparation: "Não requer preparo específico.",
    deliveryTime: "1 a 3 dias úteis",
  },
  {
    name: "Avaliação oftalmológica",
    slug: "avaliacao-oftalmologica",
    category: "COMPLEMENTAR",
    preparation: "Não requer preparo específico.",
    deliveryTime: "No dia do exame",
  },
  {
    name: "Espirometria",
    slug: "espirometria",
    category: "COMPLEMENTAR",
    preparation: "Evitar refeição volumosa 1h antes; evitar cigarro 2h antes; evitar álcool 4h antes.",
    deliveryTime: "No dia do exame",
  },
  {
    name: "Acuidade visual",
    slug: "acuidade-visual",
    category: "COMPLEMENTAR",
    preparation: "Não requer preparo específico.",
    deliveryTime: "No dia do exame",
  },
  {
    name: "Eletroencefalograma",
    slug: "eletroencefalograma",
    category: "COMPLEMENTAR",
    preparation: "Não requer preparo específico.",
    deliveryTime: "1 a 3 dias úteis",
  },
  {
    name: "Eletrocardiograma",
    slug: "eletrocardiograma",
    category: "COMPLEMENTAR",
    preparation: "Pele limpa e desengordurada. Avaliar necessidade de remoção de pelos.",
    deliveryTime: "No dia do exame",
  },
  {
    name: "Exames laboratoriais",
    slug: "exames-laboratoriais",
    category: "LABORATORIAL",
    preparation: "Verificar tipo de exame solicitado. Alguns exigem jejum.",
    deliveryTime: "1 a 3 dias úteis",
    notes: "Consulte preparo específico para cada exame laboratorial.",
  },
  {
    name: "Radiografias",
    slug: "radiografias",
    category: "COMPLEMENTAR",
    preparation: "Gestantes devem informar a condição antes do exame.",
    deliveryTime: "1 a 2 dias úteis",
  },
  {
    name: "Tomografia",
    slug: "tomografia",
    category: "COMPLEMENTAR",
    preparation: "Jejum de 6 horas. Medicamentos conforme orientação da clínica.",
    deliveryTime: "2 a 5 dias úteis",
  },
];
