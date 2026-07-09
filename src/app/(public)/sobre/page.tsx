import { AboutCTA } from "@/components/public/about/AboutCTA";
import { AboutDeliverables } from "@/components/public/about/AboutDeliverables";
import { AboutHero } from "@/components/public/about/AboutHero";
import { AboutIntroSection } from "@/components/public/about/AboutIntroSection";
import { AboutMissionVision } from "@/components/public/about/AboutMissionVision";
import { AboutTrustSection } from "@/components/public/about/AboutTrustSection";
import { AboutWorkProcess } from "@/components/public/about/AboutWorkProcess";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.sobre);

export default function SobrePage() {
  const clinic = getClinicInfo();
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com um especialista da ${clinic.name}.`
  );

  return (
    <>
      <AboutHero clinicName={clinic.name} />
      <AboutIntroSection clinicName={clinic.name} />
      <AboutDeliverables />
      <AboutWorkProcess />
      <AboutTrustSection />
      <AboutMissionVision />
      <AboutCTA whatsappHref={whatsappHref} />
    </>
  );
}
