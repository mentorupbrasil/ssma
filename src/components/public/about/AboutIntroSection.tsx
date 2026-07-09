import Link from "next/link";
import { Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/helpers";
import type { ClinicSiteConfig } from "@/config/clinic";

type AboutIntroSectionProps = {
  config: ClinicSiteConfig;
  clinicName: string;
  whatsappHref: string;
};

export function AboutIntroSection({ config, clinicName, whatsappHref }: AboutIntroSectionProps) {
  return (
    <section id="quem-somos" className="about-intro scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <div className="about-intro-grid">
          <div>
            <p className="about-eyebrow about-eyebrow--muted">Quem somos</p>
            <h2 className="about-section-heading">
              Uma clínica preparada para simplificar a rotina ocupacional das empresas
            </h2>
            <div className="about-intro-prose">
              <p>
                A {clinicName} atua em Medicina e Segurança do Trabalho, apoiando empresas de
                pequeno, médio e grande porte na organização de exames, ASOs, programas, laudos e
                documentação ocupacional com atenção à conformidade legal.
              </p>
              <p>
                Nosso diferencial é unir estrutura presencial de qualidade com um portal
                empresarial para encaminhamento online, acompanhamento de status e centralização
                documental — menos retrabalho para o RH, mais previsibilidade para a empresa.
              </p>
            </div>
          </div>

          <div className="about-intro-card">
            <div className="about-intro-card-header">
              <p className="about-intro-card-kicker">Atendimento empresarial</p>
              <h3 className="about-intro-card-title">{clinicName}</h3>
              <p className="about-intro-card-sub">
                {config.city} · {config.state}
              </p>
            </div>
            <ul className="about-intro-card-list">
              {config.hasAddress && (
                <li>
                  <MapPin className="about-intro-card-icon" strokeWidth={1.75} />
                  <span>{config.fullAddress}</span>
                </li>
              )}
              <li>
                <Clock className="about-intro-card-icon" strokeWidth={1.75} />
                <span>{config.openingHours}</span>
              </li>
              {config.hasWhatsApp && (
                <li>
                  <Phone className="about-intro-card-icon" strokeWidth={1.75} />
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    WhatsApp: {formatPhone(config.whatsapp)}
                  </a>
                </li>
              )}
            </ul>
            <div className="about-intro-card-actions">
              {config.hasMapLink && (
                <a
                  href={config.googleMapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="brand" className="w-full rounded-xl">
                    <Navigation className="mr-2 h-4 w-4" />
                    Ver localização
                  </Button>
                </a>
              )}
              <Link href="/contato">
                <Button variant="outline" className="w-full rounded-xl">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Falar com a clínica
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
