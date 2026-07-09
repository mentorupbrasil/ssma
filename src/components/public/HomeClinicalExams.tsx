import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { CLINICAL_EXAM_TYPES } from "@/data/marketing";
import { SectionHeader } from "@/components/public/SectionHeader";
import { Button } from "@/components/ui/button";

/** Seção exclusiva da página inicial — não compartilhar com /exames. */
export function HomeClinicalExams() {
  return (
    <section className="home-clinical scroll-mt-[var(--header-height)]" id="exames-clinicos">
      <div className="container-page">
        <SectionHeader
          eyebrow="Mais solicitados"
          title="Exames clínicos ocupacionais"
          description="Essenciais para admissões, acompanhamento periódico, desligamentos e retorno ao trabalho com conformidade legal."
        />

        <ol className="home-clinical-list">
          {CLINICAL_EXAM_TYPES.map((exam, index) => (
            <li
              key={exam.type}
              className={exam.highlight ? "home-clinical-item home-clinical-item--highlight" : "home-clinical-item"}
            >
              <span className="home-clinical-item-num">{String(index + 1).padStart(2, "0")}</span>
              <div className="home-clinical-item-body">
                <div className="home-clinical-item-head">
                  <h3 className="home-clinical-item-title">{exam.label}</h3>
                  {exam.highlight && (
                    <span className="home-clinical-item-flag">
                      <Star className="h-3 w-3" strokeWidth={2} />
                      Mais comum
                    </span>
                  )}
                </div>
                <p className="home-clinical-item-desc">{exam.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="home-clinical-cta">
          <Link href="/encaminhamento-online">
            <Button variant="brand" size="lg" className="rounded-xl">
              Fazer encaminhamento online
              <ArrowRight className="ml-2 h-4 w-4" />
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
