import { getClinicSiteConfig } from "@/config/clinic";
import { AboutAreas } from "@/components/public/about/AboutAreas";
import { AboutCompliance } from "@/components/public/about/AboutCompliance";
import { AboutCTA } from "@/components/public/about/AboutCTA";
import { AboutDifferentials } from "@/components/public/about/AboutDifferentials";
import { AboutHero } from "@/components/public/about/AboutHero";
import { AboutIntroSection } from "@/components/public/about/AboutIntroSection";
import { AboutMissionVision } from "@/components/public/about/AboutMissionVision";
import { AboutStatsSection } from "@/components/public/about/AboutStatsSection";
import { AboutWorkProcess } from "@/components/public/about/AboutWorkProcess";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.sobre);

export default function SobrePage() {
  const clinic = getClinicInfo();
  const config = getClinicSiteConfig();
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com um especialista da ${clinic.name}.`
  );

  return (
    <>
      <AboutHero clinicName={clinic.name} whatsappHref={whatsappHref} />
      <AboutIntroSection config={config} clinicName={clinic.name} whatsappHref={whatsappHref} />
      <AboutStatsSection />
      <AboutWorkProcess />
      <AboutDifferentials />
      <AboutMissionVision />
      <AboutAreas />
      <AboutCompliance />
      <AboutCTA whatsappHref={whatsappHref} />
    </>
  );
}
