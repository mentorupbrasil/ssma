import { EditorialHero } from "@/components/public/EditorialHero";
import { CONTACT_WHATSAPP_MESSAGES } from "@/data/contact";
import { EDITORIAL_HERO_CONTENT } from "@/data/editorial-hero";
import { whatsappLink } from "@/lib/helpers";

const content = EDITORIAL_HERO_CONTENT.contato;

type ContactHeroProps = {
  hasWhatsApp: boolean;
};

export function ContactHero({ hasWhatsApp }: ContactHeroProps) {
  const whatsappHref = whatsappLink(CONTACT_WHATSAPP_MESSAGES.direct);

  return (
    <EditorialHero
      ctaPill={{
        href: hasWhatsApp ? whatsappHref : "#contato-formulario",
        label: content.ctaLabel,
        external: hasWhatsApp,
      }}
      titleLines={content.titleLines}
      descriptionLines={content.descriptionLines}
    />
  );
}
