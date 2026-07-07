import Link from "next/link";
import { CLINICAL_EXAM_TYPES } from "@/data/marketing";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export function TopClinicalExams() {
  return (
    <section className="section-padding bg-[var(--brand-mint)]/50">
      <div className="container-page">
        <SectionTitle
          eyebrow="Mais solicitados"
          title="Exames clínicos ocupacionais"
          description="Essenciais para cumprir a legislação e proteger a saúde dos colaboradores."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CLINICAL_EXAM_TYPES.map((exam) => (
            <div
              key={exam.type}
              className="premium-card-hover relative border-slate-200/80 p-5"
            >
              {exam.highlight && (
                <Badge className="absolute right-4 top-4 bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]">
                  TOP 1
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="mb-3 bg-amber-100 text-amber-900 hover:bg-amber-100"
              >
                {exam.badge}
              </Badge>
              <h3 className="text-lg font-semibold text-[var(--brand-navy)]">{exam.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{exam.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
