import { AboutDeliverables } from "@/components/public/about/AboutDeliverables";
import { AboutFinalCTA } from "@/components/public/about/AboutFinalCTA";
import { AboutHero } from "@/components/public/about/AboutHero";
import { AboutHistory } from "@/components/public/about/AboutHistory";
import { AboutInstitutionalStrip } from "@/components/public/about/AboutInstitutionalStrip";
import { AboutMissionVision } from "@/components/public/about/AboutMissionVision";
import { AboutMotionRoot } from "@/components/public/about/AboutMotionRoot";
import { AboutStructure } from "@/components/public/about/AboutStructure";
import { AboutTeam } from "@/components/public/about/AboutTeam";
import { AboutTrustSection } from "@/components/public/about/AboutTrustSection";
import { AboutWorkProcess } from "@/components/public/about/AboutWorkProcess";
import { getClinicSiteConfig } from "@/config/clinic";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { createPageMetadata, getSiteUrl, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.sobre);

function AboutPageJsonLd() {
  const clinic = getClinicSiteConfig();
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: clinic.clinicName,
    url: `${siteUrl}/sobre`,
    description: PUBLIC_PAGE_SEO.sobre.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinic.address,
      addressLocality: clinic.city,
      addressRegion: clinic.state,
      postalCode: clinic.postalCode,
      addressCountry: "BR",
    },
    ...(clinic.phone ? { telephone: clinic.phone } : {}),
    email: clinic.email,
    areaServed: `${clinic.city}, ${clinic.state}`,
    medicalSpecialty: "Occupational Medicine",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function SobrePage() {
  const clinic = getClinicInfo();
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com a equipe da ${clinic.name} sobre saúde ocupacional.`
  );

  return (
    <AboutMotionRoot>
      <AboutPageJsonLd />
      <AboutHero clinicName={clinic.name} />
      <AboutInstitutionalStrip />
      <AboutHistory />
      <AboutDeliverables />
      <AboutStructure />
      <AboutTeam />
      <AboutWorkProcess />
      <AboutTrustSection />
      <AboutMissionVision />
      <AboutFinalCTA whatsappHref={whatsappHref} />
    </AboutMotionRoot>
  );
}
