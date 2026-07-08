import { MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { ContactQuickActions } from "@/components/public/ContactQuickActions";
import { ContactInfoPanel } from "@/components/public/ContactInfoPanel";
import { LocationMap } from "@/components/public/LocationMap";
import { PageHero } from "@/components/public/PageHero";
import { PageSection } from "@/components/public/PageSection";
import { getClinicSiteConfig } from "@/config/clinic";
import { resolveContactPrefill, CONTACT_WHATSAPP_MESSAGES } from "@/data/contact";
import { whatsappLink } from "@/lib/helpers";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Contato" };

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
      <PageHero
        eyebrow="FALE CONOSCO"
        title="Entre em contato"
        description="Nossa equipe comercial responde com agilidade. Para demandas urgentes, fale diretamente pelo WhatsApp."
        layout="stack"
      >
        {clinic.hasWhatsApp && (
          <a
            href={whatsappLink(CONTACT_WHATSAPP_MESSAGES.direct)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="brand" className="rounded-xl">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp direto
            </Button>
          </a>
        )}
      </PageHero>

      <PageSection className="!py-8 md:!py-10">
        <ContactQuickActions />
      </PageSection>

      <PageSection variant="muted">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div id="contato-formulario" className="scroll-mt-[calc(var(--header-height)+1rem)]">
            <h2 className="form-panel-title">Formulário de contato</h2>
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
    </>
  );
}
