import Link from "next/link";
import { CLINICAL_EXAM_TYPES } from "@/data/marketing";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function TopClinicalExams() {
  return (
    <section className="clinical-exams-section scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionTitle
          eyebrow="Mais solicitados"
          title="Exames clínicos ocupacionais"
          description="Essenciais para cumprir a legislação e proteger a saúde dos colaboradores."
          className="clinical-exams-title"
        />

        <div className="clinical-exams-grid">
          {CLINICAL_EXAM_TYPES.map((exam) => (
            <div key={exam.type} className="clinical-exam-card group">
              {exam.highlight && <span className="clinical-exam-badge-top">Top 1</span>}
              <span className="clinical-exam-badge-required">{exam.badge}</span>
              <h3 className="clinical-exam-card-title">{exam.label}</h3>
              <p className="clinical-exam-card-desc">{exam.description}</p>
            </div>
          ))}
        </div>

        <div className="clinical-exams-cta">
          <Link href="/encaminhamento-online">
            <Button variant="brand" size="lg" className="rounded-xl">
              Fazer encaminhamento online
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/exames">
            <Button variant="outline" size="lg" className="rounded-xl">
              Ver preparo de exames
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
