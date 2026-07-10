import { ServicesHero } from "@/components/public/ServicesHero";
import { ServicesQuickNav } from "@/components/public/ServicesQuickNav";
import { ServicesCategorySection } from "@/components/public/ServicesCategorySection";
import { CTASection } from "@/components/public/CTASection";
import { SERVICE_CATEGORIES } from "@/data/services";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.servicos);

const QUICK_NAV_ITEMS = SERVICE_CATEGORIES.map((category) => ({
  id: category.id,
  label: category.title,
}));

export default function ServicosPage() {
  const clinic = getClinicInfo();
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com um especialista da ${clinic.name} sobre serviços de SST.`
  );

  return (
    <>
      <ServicesHero whatsappHref={whatsappHref} />

      <ServicesQuickNav items={QUICK_NAV_ITEMS} />

      {SERVICE_CATEGORIES.map((category, index) => (
        <ServicesCategorySection
          key={category.id}
          category={category}
          index={index}
          whatsappHref={whatsappHref}
        />
      ))}

      <CTASection
        className="services-final-cta"
        title="Precisa regularizar exames, laudos ou documentos ocupacionais?"
        description="Nossa equipe monta uma proposta conforme o porte da empresa, riscos ocupacionais e serviços necessários."
        primaryLabel="Solicitar orçamento"
        secondaryHref={whatsappHref}
        secondaryLabel="Falar no WhatsApp"
      />
    </>
  );
}
