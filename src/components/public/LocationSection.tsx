import Link from "next/link";
import { Clock, ExternalLink, MapPin, MessageCircle } from "lucide-react";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { getClinicSiteConfig } from "@/config/clinic";
import { formatPhone, whatsappLink } from "@/lib/helpers";

export function LocationSection() {
  const clinic = getClinicSiteConfig();

  return (
    <section className="location-section scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionTitle
          eyebrow="Localização"
          title="Onde estamos"
          description="Atendimento presencial para exames ocupacionais e suporte digital para empresas."
          className="location-section-title"
        />

        <div className="location-grid">
          <div className="location-map-wrap">
            {clinic.hasMapEmbed ? (
              <iframe
                src={clinic.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                className="location-map-frame"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa — ${clinic.clinicName}`}
              />
            ) : (
              <div className="location-map-placeholder">
                <MapPin className="location-map-placeholder-icon" strokeWidth={1.5} />
                <p className="location-map-placeholder-title">Mapa da clínica</p>
                <p className="location-map-placeholder-desc">
                  O mapa será exibido quando o endereço e a URL do Google Maps forem configurados.
                </p>
              </div>
            )}
          </div>

          <div className="location-info-card">
            <h3 className="location-info-card-heading">Informações de atendimento</h3>

            <dl className="location-info-list">
              <div className="location-info-item">
                <dt className="location-info-label">
                  <MapPin className="location-info-icon" strokeWidth={1.75} />
                  Endereço da clínica
                </dt>
                <dd className="location-info-value">
                  {clinic.hasAddress ? clinic.fullAddress : "Endereço em atualização"}
                </dd>
              </div>

              <div className="location-info-item">
                <dt className="location-info-label">
                  <Clock className="location-info-icon" strokeWidth={1.75} />
                  Horário de atendimento
                </dt>
                <dd className="location-info-value">
                  {clinic.openingHours || "Horário de atendimento a confirmar"}
                </dd>
              </div>

              {clinic.hasWhatsApp && (
                <div className="location-info-item">
                  <dt className="location-info-label">
                    <MessageCircle className="location-info-icon" strokeWidth={1.75} />
                    WhatsApp
                  </dt>
                  <dd className="location-info-value">{formatPhone(clinic.whatsapp)}</dd>
                </div>
              )}
            </dl>

            <div className="location-info-actions">
              {clinic.hasMapLink && (
                <a
                  href={clinic.googleMapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="location-info-btn w-full rounded-xl">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir no Google Maps
                  </Button>
                </a>
              )}
              {clinic.hasWhatsApp ? (
                <a
                  href={whatsappLink(
                    `Olá! Gostaria de falar com a ${clinic.clinicName} sobre atendimento ocupacional.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="brand" className="location-info-btn w-full rounded-xl">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Falar no WhatsApp
                  </Button>
                </a>
              ) : (
                <Link href="/contato">
                  <Button variant="brand" className="location-info-btn w-full rounded-xl">
                    Entrar em contato
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
