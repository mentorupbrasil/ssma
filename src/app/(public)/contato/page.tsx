import { MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/public/PageHero";
import { ContactInfoPanel } from "@/components/public/ContactInfoPanel";
import { PageSection } from "@/components/public/PageSection";
import { getClinicSiteConfig } from "@/config/clinic";
import { whatsappLink } from "@/lib/helpers";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Contato" };

export default async function ContatoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const clinic = getClinicSiteConfig();
  const isOrcamento = tipo === "orcamento";

  return (
    <>
      <PageHero
        eyebrow="Fale conosco"
        title={isOrcamento ? "Solicitar orçamento" : "Entre em contato"}
        description="Nossa equipe comercial responde com agilidade. Para demandas urgentes, use o WhatsApp."
      >
        {clinic.hasWhatsApp && (
          <a
            href={whatsappLink("Olá! Gostaria de falar com um especialista.")}
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

      <PageSection>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div>
            <h2 className="form-panel-title">
              {isOrcamento ? "Formulário de orçamento" : "Formulário de contato"}
            </h2>
            <p className="form-panel-desc">
              Preencha os dados e retornaremos em breve. Você também pode falar diretamente pelo
              WhatsApp.
            </p>
            <div className="page-content-card mt-6">
              <ContactForm type={isOrcamento ? "orcamento" : "contato"} />
            </div>
          </div>

          <div className="space-y-5">
            <ContactInfoPanel />
            {clinic.hasMapEmbed && (
              <div className="location-map-wrap min-h-[14rem] lg:min-h-[16rem]">
                <iframe
                  src={clinic.googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  className="location-map-frame"
                  style={{ border: 0 }}
                  loading="lazy"
                  title={`Mapa — ${clinic.clinicName}`}
                />
              </div>
            )}
          </div>
        </div>
      </PageSection>
    </>
  );
}
