import { Suspense } from "react";
import { ExamSearch } from "@/components/public/ExamSearch";
import { ExamsCTA } from "@/components/public/exams/ExamsCTA";
import { ExamsHero } from "@/components/public/exams/ExamsHero";
import { TopClinicalExams } from "@/components/public/TopClinicalExams";
import { getPublicWebsiteExams } from "@/actions/exams";
import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.exames);

async function ExamCatalogSection() {
  const exams = await getPublicWebsiteExams();
  return <ExamSearch exams={exams} />;
}

export default async function ExamesPage() {
  return (
    <>
      <ExamsHero />
      <TopClinicalExams />

      <section id="preparo-por-exame" className="exams-catalog-section scroll-mt-[var(--header-height)]">
        <div className="container-page">
          <div className="exams-catalog-header">
            <p className="exams-section-eyebrow">Catálogo completo</p>
            <h2 className="exams-section-title">Preparo por exame</h2>
            <p className="exams-section-lead">
              Busque pelo nome ou filtre por categoria para encontrar orientações de preparo, prazos
              e observações importantes.
            </p>
          </div>

          <Suspense
            fallback={
              <p className="py-12 text-center text-sm text-slate-500">
                Carregando catálogo de exames...
              </p>
            }
          >
            <ExamCatalogSection />
          </Suspense>
        </div>
      </section>

      <ExamsCTA />
    </>
  );
}
