import Link from "next/link";
import { Clock, ExternalLink, MapPin, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatClinicAddressLines,
  formatOpeningHoursLines,
  getClinicSiteConfig,
} from "@/config/clinic";
import { formatPhone, whatsappLink } from "@/lib/helpers";
import { CONTACT_WHATSAPP_MESSAGES } from "@/data/contact";

export function ContactInfoPanel() {
  const clinic = getClinicSiteConfig();
  const hoursLines = formatOpeningHoursLines(clinic.openingHours);

  return (
    <div className="contact-info-panel contact-info-panel-premium">
      <h3 className="contact-info-panel-heading">Informações de contato</h3>
      <dl className="contact-info-list">
        {clinic.hasAddress && (
          <div className="contact-info-item">
            <dt>
              <MapPin strokeWidth={1.75} />
              Endereço
            </dt>
            <dd>
              {formatClinicAddressLines(clinic).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </dd>
          </div>
        )}
        {clinic.email && (
          <div className="contact-info-item">
            <dt>
              <Mail strokeWidth={1.75} />
              E-mail
            </dt>
            <dd>
              <a href={`mailto:${clinic.email}`} className="contact-info-link">
                {clinic.email}
              </a>
            </dd>
          </div>
        )}
        <div className="contact-info-item">
          <dt>
            <Clock strokeWidth={1.75} />
            Horário
          </dt>
          <dd>
            {hoursLines.length > 0
              ? hoursLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))
              : "Horário de atendimento a confirmar"}
          </dd>
        </div>
        {clinic.hasWhatsApp && (
          <div className="contact-info-item">
            <dt>
              <MessageCircle strokeWidth={1.75} />
              WhatsApp
            </dt>
            <dd>{formatPhone(clinic.whatsapp)}</dd>
          </div>
        )}
      </dl>
      <div className="contact-info-actions">
        {clinic.hasWhatsApp && (
          <a
            href={whatsappLink(CONTACT_WHATSAPP_MESSAGES.direct)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="brand" className="w-full rounded-xl">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </a>
        )}
        {clinic.hasMapLink && (
          <a href={clinic.googleMapsExternalUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full rounded-xl">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir no Google Maps
            </Button>
          </a>
        )}
        <Link href="/contato?tipo=orcamento#contato-formulario">
          <Button variant="outline" className="w-full rounded-xl">
            Solicitar orçamento
          </Button>
        </Link>
      </div>
    </div>
  );
}
