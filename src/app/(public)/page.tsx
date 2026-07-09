import { CTASection } from "@/components/public/CTASection";
import { FAQSection } from "@/components/public/FAQSection";
import { HomeHero } from "@/components/public/HomeHero";
import { HomeClinicalExams } from "@/components/public/HomeClinicalExams";
import { HomeComplianceSection } from "@/components/public/home/HomeComplianceSection";
import { HomePortalSection } from "@/components/public/home/HomePortalSection";
import { HomeProcessSection } from "@/components/public/home/HomeProcessSection";
import { HomeWhyChooseSection } from "@/components/public/home/HomeWhyChooseSection";
import { HomeLocationSection } from "@/components/public/home/HomeLocationSection";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

export default async function HomePage() {
  const clinic = getClinicInfo();
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com a ${clinic.name} sobre saúde ocupacional.`
  );

  return (
    <>
      <HomeHero />

      <HomeComplianceSection />

      <HomeClinicalExams />

      <HomePortalSection />

      <HomeProcessSection />

      <HomeWhyChooseSection />

      <HomeLocationSection />

      <FAQSection />

      <CTASection
        className="home-final-cta"
        title="Pronto para organizar a saúde ocupacional da sua empresa?"
        description="Fale com a Unimetra e veja como simplificar exames, documentos, encaminhamentos e rotinas de SST."
        primaryLabel="Solicitar orçamento"
        secondaryHref={whatsappHref}
        secondaryLabel="Falar no WhatsApp"
      />
    </>
  );
}
