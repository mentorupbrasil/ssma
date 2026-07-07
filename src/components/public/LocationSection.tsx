import Link from "next/link";
import { Clock, ExternalLink, MapPin, MessageCircle, Phone } from "lucide-react";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import {
  formatAddressLines,
  formatOpeningHoursLines,
  getClinicSiteConfig,
} from "@/config/clinic";
import { formatPhone, whatsappLink } from "@/lib/helpers";

export function LocationSection() {
  const clinic = getClinicSiteConfig();
  const addressLines = clinic.hasAddress
    ? formatAddressLines(clinic.fullAddress)
    : ["Endereço em atualização"];
  const hoursLines = formatOpeningHoursLines(clinic.openingHours);

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
                  Configure o endereço ou as coordenadas no painel de configuração.
                </p>
              </div>
            )}
          </div>

          <div className="location-info-card">
            <div className="location-info-card-header">
              <div className="location-info-card-header-icon">
                <MapPin strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="location-info-card-heading">Informações de atendimento</h3>
                <p className="location-info-card-subheading">{clinic.clinicName}</p>
              </div>
            </div>

            <dl className="location-info-list">
              <div className="location-info-row">
                <dt className="location-info-row-label">
                  <span className="location-info-row-icon">
                    <MapPin strokeWidth={1.75} />
                  </span>
                  Endereço
                </dt>
                <dd className="location-info-row-value">
                  {addressLines.map((line) => (
                    <span key={line} className="location-info-line">
                      {line}
                    </span>
                  ))}
                </dd>
              </div>

              <div className="location-info-row">
                <dt className="location-info-row-label">
                  <span className="location-info-row-icon">
                    <Clock strokeWidth={1.75} />
                  </span>
                  Horário
                </dt>
                <dd className="location-info-row-value">
                  {hoursLines.length > 0 ? (
                    hoursLines.map((line) => (
                      <span key={line} className="location-info-line">
                        {line}
                      </span>
                    ))
                  ) : (
                    <span className="location-info-line">Horário a confirmar</span>
                  )}
                </dd>
              </div>

              {clinic.phone && (
                <div className="location-info-row">
                  <dt className="location-info-row-label">
                    <span className="location-info-row-icon">
                      <Phone strokeWidth={1.75} />
                    </span>
                    Telefone
                  </dt>
                  <dd className="location-info-row-value">
                    <a href={`tel:${clinic.phone.replace(/\D/g, "")}`} className="location-info-link">
                      {clinic.phone}
                    </a>
                  </dd>
                </div>
              )}

              {clinic.hasWhatsApp && (
                <div className="location-info-row">
                  <dt className="location-info-row-label">
                    <span className="location-info-row-icon">
                      <MessageCircle strokeWidth={1.75} />
                    </span>
                    WhatsApp
                  </dt>
                  <dd className="location-info-row-value">
                    <a
                      href={whatsappLink(
                        `Olá! Gostaria de falar com a ${clinic.clinicName}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="location-info-link location-info-link-whatsapp"
                    >
                      {formatPhone(clinic.whatsapp)}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            <div className="location-info-actions">
              {clinic.hasMapLink && (
                <a
                  href={clinic.googleMapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="location-info-action-link"
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
                  className="location-info-action-link"
                >
                  <Button variant="brand" className="location-info-btn w-full rounded-xl">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Falar no WhatsApp
                  </Button>
                </a>
              ) : (
                <Link href="/contato" className="location-info-action-link">
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
