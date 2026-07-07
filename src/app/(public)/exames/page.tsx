import { ExamSearch } from "@/components/public/ExamSearch";
import { PageHero } from "@/components/public/PageHero";
import { TopClinicalExams } from "@/components/public/TopClinicalExams";
import { CTASection } from "@/components/public/CTASection";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Exames e Preparos" };

export default async function ExamesPage() {
  const exams = await prisma.exam.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHero
        eyebrow="Exames ocupacionais"
        title="Exames e preparos"
        description="Consulte o preparo necessário para cada exame. Essenciais para cumprir a legislação e proteger a saúde dos colaboradores."
      />

      <TopClinicalExams />

      <section className="section-padding bg-white">
        <div className="container-page">
          <ExamSearch exams={exams} />
        </div>
      </section>

      <CTASection
        title="Precisa encaminhar colaboradores para exame?"
        description="Use o encaminhamento online ou fale com nossa equipe."
        secondaryHref="/encaminhamento-online"
        secondaryLabel="Encaminhamento online"
      />
    </>
  );
}
