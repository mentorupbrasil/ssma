import { EditorialHero } from "@/components/public/EditorialHero";
import { SERVICES_HERO_BADGES } from "@/data/services";

type ServicesHeroProps = {
  whatsappHref: string;
};

export function ServicesHero({ whatsappHref }: ServicesHeroProps) {
  return (
    <EditorialHero
      ctaPill={{ href: whatsappHref, label: "Falar com especialista", external: true }}
      title="Soluções completas em Saúde e Segurança do Trabalho para empresas"
      description="Exames ocupacionais, programas, laudos, documentação e suporte ao RH para manter sua empresa em conformidade com mais organização."
      badges={SERVICES_HERO_BADGES}
      badgesAriaLabel="Áreas de atuação"
    />
  );
}
