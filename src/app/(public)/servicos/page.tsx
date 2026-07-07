import { PageHero } from "@/components/public/PageHero";
import { SectionTitle } from "@/components/public/SectionTitle";
import { ServiceCard } from "@/components/public/ServiceCard";
import { CTASection } from "@/components/public/CTASection";
import { PageSection } from "@/components/public/PageSection";
import { SERVICE_CATEGORIES } from "@/data/services";

export const metadata = { title: "Serviços" };

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Portfólio completo"
        title="Soluções em Saúde e Segurança do Trabalho"
        description="PCMSO, ASO, laudos, exames e documentação ocupacional com equipe habilitada e conformidade legal."
      />

      {SERVICE_CATEGORIES.map((category, index) => (
        <PageSection key={category.id} variant={index % 2 === 0 ? "default" : "white"}>
          <SectionTitle
            eyebrow="Serviços"
            title={category.title}
            align="left"
            className="!mb-8 md:!mb-9"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.services.map((service) => (
              <ServiceCard key={service.name} {...service} />
            ))}
          </div>
        </PageSection>
      ))}

      <CTASection
        title="Precisa de um serviço específico?"
        description="Nossa equipe pode montar uma proposta personalizada para sua empresa."
        primaryLabel="Solicitar orçamento sem compromisso"
      />
    </>
  );
}
