import Link from "next/link";
import { Suspense } from "react";
import { ExamSearch } from "@/components/public/ExamSearch";
import { PageHero } from "@/components/public/PageHero";
import { TopClinicalExams } from "@/components/public/TopClinicalExams";
import { CTASection } from "@/components/public/CTASection";
import { PageSection } from "@/components/public/PageSection";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { EXAM_GUIDES } from "@/data/exams";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Exames e Preparos" };

export default async function ExamesPage() {
  const clinic = getClinicInfo();
  const dbExams = await prisma.exam.findMany({
    where: { active: true },
    select: { slug: true },
  });
  const activeSlugs = new Set(dbExams.map((exam) => exam.slug));
  const exams =
    activeSlugs.size > 0
      ? EXAM_GUIDES.filter((guide) => activeSlugs.has(guide.slug))
      : EXAM_GUIDES;

  return (
    <>
      <PageHero
        eyebrow="Exames ocupacionais"
        title="Exames e preparos"
        description="Consulte orientações de preparo, prazos e observações importantes para exames ocupacionais."
        layout="stack"
        className="exams-page-hero"
      >
        <Link href="/encaminhamento-online">
          <Button variant="brand" className="rounded-xl">
            Fazer encaminhamento online
          </Button>
        </Link>
        <a
          href={whatsappLink(
            `Olá! Gostaria de falar com um especialista da ${clinic.name} sobre exames ocupacionais.`
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            className="rounded-xl border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Falar com especialista
          </Button>
        </a>
      </PageHero>

      <TopClinicalExams />

      <PageSection variant="white" id="preparo-por-exame" className="exams-prep-section">
        <SectionTitle
          eyebrow="Catálogo completo"
          title="Preparo por exame"
          description="Busque pelo nome ou filtre por categoria para encontrar orientações de preparo e prazos."
          align="left"
          className="exams-prep-section-title !mb-6 md:!mb-7"
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
        className="exams-final-cta"
        title="Precisa encaminhar colaboradores para exame?"
        description="Use o encaminhamento online ou fale com nossa equipe para organizar o atendimento da sua empresa."
        primaryLabel="Fazer encaminhamento online"
        primaryHref="/encaminhamento-online"
        secondaryHref="/contato?tipo=orcamento"
        secondaryLabel="Solicitar orçamento"
      />
    </>
  );
}
