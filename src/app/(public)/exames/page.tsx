import { Suspense } from "react";
import { ExamSearch } from "@/components/public/ExamSearch";
import { PageHero } from "@/components/public/PageHero";
import { TopClinicalExams } from "@/components/public/TopClinicalExams";
import { CTASection } from "@/components/public/CTASection";
import { PageSection } from "@/components/public/PageSection";
import { SectionTitle } from "@/components/public/SectionTitle";
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

      <PageSection variant="white">
        <SectionTitle
          eyebrow="Catálogo completo"
          title="Preparo por exame"
          description="Busque pelo nome ou filtre por categoria para encontrar orientações de preparo e prazos."
          align="left"
          className="!mb-6 md:!mb-7"
        />
        <Suspense
          fallback={
            <p className="py-10 text-center text-sm text-slate-500">Carregando catálogo de exames...</p>
          }
        >
          <ExamSearch exams={exams} />
        </Suspense>
      </PageSection>

      <CTASection
        title="Precisa encaminhar colaboradores para exame?"
        description="Use o encaminhamento online ou fale com nossa equipe."
        primaryLabel="Fazer encaminhamento online"
        primaryHref="/encaminhamento-online"
        secondaryHref="/contato?tipo=orcamento"
        secondaryLabel="Solicitar orçamento"
      />
    </>
  );
}
