import Link from "next/link";
import {
  Calculator,
  UserPlus,
  MessageCircle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClinicSiteConfig } from "@/config/clinic";
import { whatsappLink } from "@/lib/helpers";
import { CONTACT_WHATSAPP_MESSAGES } from "@/data/contact";

export function ContactQuickActions() {
  const clinic = getClinicSiteConfig();

  const cards = [
    {
      icon: Calculator,
      title: "Solicitar orçamento",
      description: "Receba uma proposta conforme o porte da empresa e serviços necessários.",
      href: "/contato?tipo=orcamento#contato-formulario",
      label: "Solicitar orçamento",
      external: false,
    },
    {
      icon: UserPlus,
      title: "Encaminhar colaborador",
      description: "Envie uma solicitação rápida para exame ocupacional.",
      href: "/encaminhamento-online",
      label: "Fazer encaminhamento",
      external: false,
    },
    {
      icon: MessageCircle,
      title: "Falar no WhatsApp",
      description: "Atendimento rápido para dúvidas, agenda e orientações.",
      href: clinic.hasWhatsApp ? whatsappLink(CONTACT_WHATSAPP_MESSAGES.direct) : "/contato",
      label: "Abrir WhatsApp",
      external: clinic.hasWhatsApp,
    },
    {
      icon: MapPin,
      title: "Como chegar",
      description: "Veja endereço, horário de atendimento e rota pelo Google Maps.",
      href: clinic.hasMapLink ? clinic.googleMapsExternalUrl : "#contato-mapa",
      label: "Abrir mapa",
      external: clinic.hasMapLink,
    },
  ];

  return (
    <div className="contact-quick-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        const content = (
          <div className="contact-quick-card">
            <div className="contact-quick-icon">
              <Icon className="h-5 w-5 text-[var(--brand-green)]" strokeWidth={1.75} />
            </div>
            <h3 className="contact-quick-title">{card.title}</h3>
            <p className="contact-quick-desc">{card.description}</p>
            <Button variant="brand" className="contact-quick-btn mt-auto w-full rounded-xl">
              {card.label}
            </Button>
          </div>
        );

        if (card.external) {
          return (
            <a
              key={card.title}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full"
            >
              {content}
            </a>
          );
        }

        return (
          <Link key={card.title} href={card.href} className="block h-full">
            {content}
          </Link>
        );
      })}
    </div>
  );
}
