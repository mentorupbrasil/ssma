import Link from "next/link";
import { Suspense } from "react";
import { ExamSearch } from "@/components/public/ExamSearch";
import { PageHero } from "@/components/public/PageHero";
import { TopClinicalExams } from "@/components/public/TopClinicalExams";
import { CTASection } from "@/components/public/CTASection";
import { PageSection } from "@/components/public/PageSection";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { getPublicWebsiteExams } from "@/actions/exams";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.exames);

async function ExamCatalogSection() {
  const exams = await getPublicWebsiteExams();
  return <ExamSearch exams={exams} />;
}

export default async function ExamesPage() {
  const clinic = getClinicInfo();

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
          <Button variant="outline-light" className="rounded-xl">
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
          <ExamCatalogSection />
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
