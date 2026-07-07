import { SectionTitle } from "@/components/public/SectionTitle";
import { ServiceCard } from "@/components/public/ServiceCard";
import { CTASection } from "@/components/public/CTASection";
import { PageHero } from "@/components/public/PageHero";
import { SERVICE_CATEGORIES } from "@/data/services";

export const metadata = { title: "Serviços" };

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Portfólio completo"
        title="Nossos serviços"
        description="Soluções completas em medicina ocupacional e segurança do trabalho para empresas de todos os portes."
      />

      {SERVICE_CATEGORIES.map((category, index) => (
        <section key={category.id} className={index % 2 === 0 ? "section-padding" : "section-padding bg-white"}>
          <div className="container-page">
            <SectionTitle title={category.title} align="left" className="mb-10" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {category.services.map((service) => (
                <ServiceCard key={service.name} {...service} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <CTASection
        title="Precisa de um serviço específico?"
        description="Nossa equipe pode montar uma proposta personalizada para sua empresa."
      />
    </>
  );
}
