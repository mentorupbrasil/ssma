import { SectionTitle } from "@/components/public/SectionTitle";
import { ServiceCard } from "@/components/public/ServiceCard";
import { CTASection } from "@/components/public/CTASection";
import { SERVICE_CATEGORIES } from "@/data/services";

export const metadata = { title: "Serviços" };

export default function ServicosPage() {
  return (
    <>
      <section className="bg-[#0F3D4A] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">Nossos serviços</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Soluções completas em medicina ocupacional e segurança do trabalho para empresas de todos os portes.
          </p>
        </div>
      </section>

      {SERVICE_CATEGORIES.map((category) => (
        <section key={category.id} className="py-16 even:bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle title={category.title} align="left" className="mb-8" />
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
