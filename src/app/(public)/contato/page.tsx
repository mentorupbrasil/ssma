import { ContactForm } from "@/components/forms/ContactForm";
import { ContactQuickActions } from "@/components/public/ContactQuickActions";
import { ContactInfoPanel } from "@/components/public/ContactInfoPanel";
import { ContactHero } from "@/components/public/ContactHero";
import { LocationMap } from "@/components/public/LocationMap";
import { PageSection } from "@/components/public/PageSection";
import { CTASection } from "@/components/public/CTASection";
import { getClinicSiteConfig } from "@/config/clinic";
import { resolveContactPrefill, CONTACT_WHATSAPP_MESSAGES } from "@/data/contact";
import { whatsappLink } from "@/lib/helpers";

import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.contato);

export default async function ContatoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; servico?: string }>;
}) {
  const params = await searchParams;
  const clinic = getClinicSiteConfig();
  const prefill = resolveContactPrefill(params);
  const locationLabel = [clinic.city, clinic.state].filter(Boolean).join(", ");

  return (
    <>
      <ContactHero hasWhatsApp={clinic.hasWhatsApp} />

      <PageSection className="!py-8 md:!py-10">
        <ContactQuickActions />
      </PageSection>

      <PageSection variant="muted">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div id="contato-formulario" className="scroll-mt-[calc(var(--header-height)+1rem)]">
            <h2 id="contato-formulario-titulo" className="form-panel-title">Formulário de contato</h2>
            <p className="form-panel-desc">
              Preencha os dados e retornaremos em breve. Você também pode falar diretamente pelo
              WhatsApp.
            </p>
            <div className="page-content-card mt-6">
              <ContactForm prefill={prefill} />
            </div>
          </div>

          <div className="space-y-5">
            <ContactInfoPanel />
            {clinic.hasMapEmbed && (
              <div
                id="contato-mapa"
                className="contact-map-wrap scroll-mt-[calc(var(--header-height)+1rem)]"
              >
                <LocationMap
                  className="contact-map-embed"
                  embedUrl={clinic.mapEmbedUrl}
                  location={locationLabel || clinic.clinicName}
                  addressLine={clinic.address}
                  mapsUrl={clinic.hasMapLink ? clinic.googleMapsExternalUrl : undefined}
                />
              </div>
            )}
          </div>
        </div>
      </PageSection>

      {clinic.hasWhatsApp ? (
        <CTASection
          title="Precisa encaminhar colaboradores para exame?"
          description="Use o encaminhamento online ou fale com nossa equipe para organizar o atendimento da sua empresa."
          primaryHref="/encaminhamento-online"
          primaryLabel="Fazer encaminhamento online"
          secondaryHref={whatsappLink(CONTACT_WHATSAPP_MESSAGES.direct)}
          secondaryLabel="Falar no WhatsApp"
        />
      ) : (
        <CTASection
          title="Precisa encaminhar colaboradores para exame?"
          description="Use o encaminhamento online ou fale com nossa equipe para organizar o atendimento da sua empresa."
          primaryHref="/encaminhamento-online"
          primaryLabel="Fazer encaminhamento online"
          secondaryHref="/contato?tipo=orcamento"
          secondaryLabel="Solicitar orçamento"
        />
      )}
    </>
  );
}
