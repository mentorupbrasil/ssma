import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { CLINICAL_EXAM_TYPES } from "@/data/marketing";
import { CLINICAL_EXAM_ICONS } from "@/data/exams-page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TopClinicalExams() {
  return (
    <section className="exams-clinical scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <div className="exams-clinical-header">
          <p className="exams-section-eyebrow">Mais solicitados</p>
          <h2 className="exams-section-title">Exames clínicos ocupacionais</h2>
          <p className="exams-section-lead">
            Essenciais para admissões, acompanhamento periódico, desligamentos e retorno ao trabalho
            com conformidade legal.
          </p>
        </div>

        <div className="exams-clinical-grid">
          {CLINICAL_EXAM_TYPES.map((exam) => {
            const Icon = CLINICAL_EXAM_ICONS[exam.type] ?? ShieldCheck;
            return (
              <article
                key={exam.type}
                className={cn("exams-clinical-card", exam.highlight && "exams-clinical-card--featured")}
              >
                {exam.highlight && <span className="exams-clinical-top-badge">Mais solicitado</span>}
                <div className="exams-clinical-card-head">
                  <div className="exams-clinical-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </div>
                  <div className="exams-clinical-badges">
                    <span className="exams-clinical-badge">{exam.badge}</span>
                    <span className="exams-clinical-badge exams-clinical-badge--muted">ASO</span>
                  </div>
                </div>
                <h3 className="exams-clinical-card-title">{exam.label}</h3>
                <p className="exams-clinical-card-desc">{exam.description}</p>
                <p className="exams-clinical-nr">Conforme NR-7 / PCMSO</p>
              </article>
            );
          })}
        </div>

        <div className="exams-clinical-cta">
          <Link href="/encaminhamento-online">
            <Button variant="brand" size="lg" className="rounded-xl">
              Fazer encaminhamento online
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/exames#preparo-por-exame">
            <Button variant="outline" size="lg" className="rounded-xl">
              Ver preparo de exames
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
