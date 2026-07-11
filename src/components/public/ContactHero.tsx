import { MessageCircle, ArrowRight } from "lucide-react";

import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { EditorialHero } from "@/components/public/EditorialHero";
import { CONTACT_HERO_BADGES, CONTACT_WHATSAPP_MESSAGES } from "@/data/contact";
import { whatsappLink } from "@/lib/helpers";

type ContactHeroProps = {
  hasWhatsApp: boolean;
};

export function ContactHero({ hasWhatsApp }: ContactHeroProps) {
  const whatsappHref = whatsappLink(CONTACT_WHATSAPP_MESSAGES.direct);

  return (
    <EditorialHero
      pill={{ href: "#contato-formulario", label: "Fale conosco" }}
      title="Entre em contato com a Unimetra"
      description="Nossa equipe comercial responde com agilidade. Para demandas urgentes, fale diretamente pelo WhatsApp."
      badges={CONTACT_HERO_BADGES}
      badgesAriaLabel="Canais de atendimento"
      actions={
        <>
          <AboutCtaLink
            href="#contato-formulario"
            variant="brand"
            size="default"
            className="about-v2-hero-cta about-v2-hero-cta-primary group"
          >
            Enviar mensagem
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </AboutCtaLink>
          {hasWhatsApp ? (
            <AboutCtaLink
              href={whatsappHref}
              variant="outline"
              size="default"
              external
              className="about-v2-hero-cta about-v2-hero-cta-secondary group"
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp direto
            </AboutCtaLink>
          ) : (
            <AboutCtaLink
              href="/encaminhamento-online"
              variant="outline"
              size="default"
              className="about-v2-hero-cta about-v2-hero-cta-secondary group"
            >
              Encaminhamento online
            </AboutCtaLink>
          )}
        </>
      }
    />
  );
}
