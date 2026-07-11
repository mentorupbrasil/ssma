import { EditorialHero } from "@/components/public/EditorialHero";
import { EXAMS_HERO_BADGES } from "@/data/exams-page";

type ExamsHeroProps = {
  whatsappHref: string;
};

export function ExamsHero({ whatsappHref }: ExamsHeroProps) {
  return (
    <EditorialHero
      ctaPill={{ href: whatsappHref, label: "Falar com especialista", external: true }}
      title="Exames e preparos ocupacionais"
      description="Consulte preparo, prazos e observações para exames ocupacionais solicitados pela empresa, PCMSO ou avaliação médica."
      badges={EXAMS_HERO_BADGES}
      badgesAriaLabel="Destaques da página"
    />
  );
}
