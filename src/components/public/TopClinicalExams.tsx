import { Star } from "lucide-react";
import { CLINICAL_EXAM_TYPES } from "@/data/marketing";

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

        <ol className="home-clinical-list">
          {CLINICAL_EXAM_TYPES.map((exam, index) => (
            <li
              key={exam.type}
              className={
                exam.highlight ? "home-clinical-item home-clinical-item--highlight" : "home-clinical-item"
              }
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
      </div>
    </section>
  );
}
