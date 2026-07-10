import Link from "next/link";
import { ArrowRight, BadgeCheck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ABOUT_HERO, ABOUT_HERO_STRIP } from "@/data/about";
import { whatsappLink } from "@/lib/helpers";

type AboutHeroProps = {
  clinicName: string;
};

export function AboutHero({ clinicName }: AboutHeroProps) {
  const whatsappHref = whatsappLink(
    `Olá! Gostaria de falar com um especialista da ${clinicName}.`
  );

  return (
    <section className="about-hero hero-section home-hero-refined relative overflow-hidden scroll-mt-[var(--header-height)] bg-[var(--brand-navy)]">
      <div className="home-hero-refined-bg absolute inset-0" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(22,160,133,0.14),transparent_50%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(22,160,133,0.1),transparent_45%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"
        aria-hidden
      />

      <div className="container-page relative">
        <div className="about-hero-center animate-fade-up">
          <p className="about-hero-eyebrow">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--brand-green)]" aria-hidden />
            {ABOUT_HERO.eyebrow}
          </p>

          <h1 className="about-hero-title">
            Saúde ocupacional com cuidado,{" "}
            <span className="text-gradient-hero">precisão e confiança</span>
          </h1>

          <p className="about-hero-desc">{ABOUT_HERO.description}</p>

          <div className="about-hero-actions">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <Button variant="brand" size="lg" className="w-full rounded-xl sm:w-auto sm:min-w-[210px]">
                <Phone className="mr-2 h-4 w-4" />
                {ABOUT_HERO.primaryCta}
              </Button>
            </a>
            <Link href="/servicos">
              <Button variant="outline-light" size="lg" className="group w-full rounded-xl sm:w-auto sm:min-w-[210px]">
                {ABOUT_HERO.secondaryCta}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          <ul className="about-hero-meta" aria-label="Áreas de atuação">
            {ABOUT_HERO_STRIP.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
