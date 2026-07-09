import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExamsCTA() {
  return (
    <section className="exams-cta scroll-mt-[var(--header-height)]">
      <div className="exams-cta-glow" aria-hidden />
      <div className="container-page relative">
        <h2 className="exams-cta-title">Precisa encaminhar colaboradores para exame?</h2>
        <p className="exams-cta-desc">
          Use o encaminhamento online ou fale com nossa equipe para organizar o atendimento da sua
          empresa.
        </p>
        <div className="exams-cta-actions">
          <Link href="/encaminhamento-online">
            <Button variant="brand" size="lg" className="rounded-xl">
              Fazer encaminhamento online
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/contato?tipo=orcamento">
            <Button variant="outline-light" size="lg" className="rounded-xl">
              Solicitar orçamento
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
