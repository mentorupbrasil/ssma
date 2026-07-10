import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CLINICAL_EXAM_TYPES } from "@/data/marketing";
import { SectionHeader } from "@/components/public/SectionHeader";
import { HomeClinicalBento } from "@/components/public/home/HomeClinicalBento";
import { Button } from "@/components/ui/button";

/**
 * Lista exibida apenas na home — inclui a consulta clínica ocupacional
 * (encaminhamento para médico do trabalho, sem ser necessariamente um ASO)
 * além dos tipos de exame compartilhados com /exames.
 */
const HOME_CLINICAL_ITEMS = [
  ...CLINICAL_EXAM_TYPES,
  {
    type: "CONSULTA_OCUPACIONAL",
    label: "Consulta clínica ocupacional",
    description:
      "Avaliação com médico do trabalho fora do ciclo de ASO, para orientação, encaminhamento ou acompanhamento pontual.",
    highlight: false,
  },
] as const;

/** Seção exclusiva da página inicial — não compartilhar com /exames. */
export function HomeClinicalExams() {
  return (
    <section className="home-clinical scroll-mt-[var(--header-height)]" id="exames-clinicos">
      <div className="container-page">
        <SectionHeader
          eyebrow="Mais solicitados"
          title="Exames clínicos ocupacionais"
          description="Essenciais para admissões, acompanhamento periódico, desligamentos e retorno ao trabalho com conformidade legal."
          className="home-clinical-header"
        />

        <HomeClinicalBento items={HOME_CLINICAL_ITEMS} />

        <div className="home-clinical-cta">
          <Link href="/encaminhamento-online">
            <Button variant="brand" size="lg" className="rounded-xl group">
              Fazer encaminhamento online
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/exames#preparo-por-exame">
            <Button variant="outline" size="lg" className="rounded-xl">
              Ver preparos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
