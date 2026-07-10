import { AboutDeliverables } from "@/components/public/about/AboutDeliverables";
import { AboutHero } from "@/components/public/about/AboutHero";
import { AboutInstitutionalStrip } from "@/components/public/about/AboutInstitutionalStrip";
import { AboutIntroSection } from "@/components/public/about/AboutIntroSection";
import { AboutMissionVision } from "@/components/public/about/AboutMissionVision";
import { AboutMotionRoot } from "@/components/public/about/AboutMotionRoot";
import { AboutTrustSection } from "@/components/public/about/AboutTrustSection";
import { AboutWorkProcess } from "@/components/public/about/AboutWorkProcess";
import { getClinicInfo } from "@/lib/helpers";
import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.sobre);

export default function SobrePage() {
  const clinic = getClinicInfo();

  return (
    <AboutMotionRoot>
      <AboutHero clinicName={clinic.name} />
      <AboutInstitutionalStrip />
      <AboutIntroSection clinicName={clinic.name} />
      <AboutDeliverables />
      <AboutWorkProcess />
      <AboutTrustSection />
      <AboutMissionVision />
    </AboutMotionRoot>
  );
}
