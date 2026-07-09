import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

        <div className="home-clinical-grid">
          {CLINICAL_EXAM_TYPES.map((exam) => (
            <article key={exam.type} className="home-clinical-card group">
              <div className="home-clinical-card-badges">
                <span className="home-clinical-badge">ASO</span>
                <span className="home-clinical-badge home-clinical-badge--muted">NR-7</span>
              </div>
              <h3 className="home-clinical-card-title">{exam.label}</h3>
              <p className="home-clinical-card-desc">{exam.description}</p>
            </article>
          ))}
        </div>

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
