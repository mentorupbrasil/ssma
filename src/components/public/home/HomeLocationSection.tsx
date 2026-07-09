import Link from "next/link";
import { Clock, ExternalLink, MapPin, Phone } from "lucide-react";
import { SectionHeader } from "@/components/public/SectionHeader";
import { LocationMap } from "@/components/public/LocationMap";
import { Button } from "@/components/ui/button";
import {
  formatClinicAddressLines,
  formatOpeningHoursLines,
  getClinicSiteConfig,
} from "@/config/clinic";

export function HomeLocationSection() {
  const clinic = getClinicSiteConfig();
  const addressLines = clinic.hasAddress
    ? formatClinicAddressLines(clinic)
    : ["Endereço em atualização"];
  const hoursLines = formatOpeningHoursLines(clinic.openingHours);
  const locationLabel = [clinic.city, clinic.state].filter(Boolean).join(", ");

  return (
    <section className="home-location scroll-mt-[var(--header-height)]" id="localizacao">
      <div className="container-page">
        <SectionHeader
          eyebrow="Localização"
          title="Onde estamos"
          description="Atendimento presencial para exames ocupacionais e suporte digital para empresas."
        />

        <div className="home-location-grid">
          <div className="home-location-map">
            {clinic.hasMapEmbed ? (
              <LocationMap
                className="h-full min-h-[14rem] lg:min-h-[16rem]"
                embedUrl={clinic.mapEmbedUrl}
                location={locationLabel || clinic.clinicName}
                addressLine={clinic.address}
                mapsUrl={clinic.hasMapLink ? clinic.googleMapsExternalUrl : undefined}
              />
            ) : null}
          </div>

          <aside className="home-location-card">
            <h3 className="home-location-card-title">Informações de atendimento</h3>
            <p className="home-location-card-sub">{clinic.clinicName}</p>

            <dl className="home-location-rows">
              <div className="home-location-row">
                <dt>
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  Endereço
                </dt>
                <dd>
                  {addressLines.map((line) => (
                    <span key={line} className="home-location-line">
                      {line}
                    </span>
                  ))}
                </dd>
              </div>

              <div className="home-location-row">
                <dt>
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  Horário
                </dt>
                <dd>
                  {hoursLines.length > 0 ? (
                    hoursLines.map((line) => (
                      <span key={line} className="home-location-line">
                        {line}
                      </span>
                    ))
                  ) : (
                    <span className="home-location-line">Horário a confirmar</span>
                  )}
                </dd>
              </div>

              {clinic.phone && (
                <div className="home-location-row">
                  <dt>
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                    Telefone
                  </dt>
                  <dd>
                    <a
                      href={`tel:${clinic.phone.replace(/\D/g, "")}`}
                      className="home-location-link"
                    >
                      {clinic.phone}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            <div className="home-location-actions">
              {clinic.hasMapLink && (
                <a
                  href={clinic.googleMapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="home-location-map-btn rounded-xl">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Abrir no Google Maps
                  </Button>
                </a>
              )}
              <Link href="/contato">
                <Button variant="ghost" size="sm" className="home-location-map-btn rounded-xl">
                  Ver página de contato
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
