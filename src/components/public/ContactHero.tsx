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
      ctaPill={{
        href: hasWhatsApp ? whatsappHref : "#contato-formulario",
        label: "Falar com especialista",
        external: hasWhatsApp,
      }}
      title="Entre em contato com a Unimetra"
      description="Nossa equipe comercial responde com agilidade. Para demandas urgentes, fale diretamente pelo WhatsApp."
      badges={CONTACT_HERO_BADGES}
      badgesAriaLabel="Canais de atendimento"
    />
  );
}
