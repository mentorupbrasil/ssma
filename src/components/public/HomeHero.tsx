import Link from "next/link";
import {
  Shield,
  Stethoscope,
  FileCheck,
  HardHat,
  FlaskConical,
  BadgeCheck,
  Zap,
  Lock,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPortalMockup } from "@/components/public/HeroPortalMockup";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

const QUICK_CARDS = [
  { icon: FileCheck, title: "PCMSO", desc: "Programa completo conforme NR-7" },
  { icon: Stethoscope, title: "ASO", desc: "Todos os tipos legais de exame clínico" },
  { icon: FlaskConical, title: "Exames", desc: "Laboratório e complementares integrados" },
  { icon: HardHat, title: "SST", desc: "PGR, LTCAT, laudos e segurança do trabalho" },
] as const;

const CHIPS = [
  "Pequeno, médio e grande porte",
  "Profissionais habilitados",
  "Portal empresarial",
] as const;

const TRUST_ITEMS = [
  { icon: Lock, label: "LGPD" },
  { icon: Zap, label: "Encaminhamento digital" },
  { icon: Shield, label: "Conformidade NR-7" },
] as const;

export function HomeHero() {
  const clinic = getClinicInfo();

  return (
    <section className="hero-section relative overflow-hidden bg-[var(--brand-navy)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,160,133,0.22),transparent_55%)]" />
      <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-[var(--brand-green)]/10 blur-3xl" />
      <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

      <div className="container-page relative">
        {/* Main hero grid */}
        <div className="grid items-center gap-10 pb-10 pt-2 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 xl:gap-16 xl:pb-14">
          {/* Left column */}
          <div className="animate-fade-up max-w-2xl lg:max-w-none">
            <p className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-emerald-100 backdrop-blur sm:text-sm">
              <BadgeCheck className="h-4 w-4 shrink-0 text-[var(--brand-green)]" />
              <span>Saúde e Segurança do Trabalho · Atendimento empresarial</span>
            </p>

            <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.65rem] xl:text-[3rem] xl:leading-[1.08]">
              Regularize sua empresa e evite{" "}
              <span className="text-gradient-hero">multas na fiscalização</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-relaxed">
              PCMSO, ASO, exames ocupacionais e portal digital para o RH — com conformidade
              legal, laudos em dia e suporte ao eSocial SST.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {CHIPS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/20 bg-white/[0.07] px-3 py-1.5 text-[0.7rem] font-medium text-slate-200 sm:text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={whatsappLink(
                  `Olá! Gostaria de falar com um especialista em SST da ${clinic.name}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button variant="brand" size="lg" className="w-full rounded-xl px-6 sm:w-auto">
                  <Phone className="mr-2 h-4 w-4" />
                  Falar com especialista
                </Button>
              </a>
              <Link href="/contato?tipo=orcamento" className="w-full sm:w-auto">
                <Button variant="outline-light" size="lg" className="w-full rounded-xl px-6 sm:w-auto">
                  Solicitar orçamento
                </Button>
              </Link>
            </div>

            <ul className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
              {TRUST_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm text-slate-200 backdrop-blur-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-green)]/15">
                    <item.icon className="h-4 w-4 text-[var(--brand-green)]" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column — portal mockup */}
          <div className="animate-fade-up-delay w-full lg:justify-self-end lg:pt-2 xl:max-w-[34rem] xl:justify-self-center">
            <HeroPortalMockup variant="hero" />
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid gap-4 pb-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:pb-16 xl:pb-20">
          {QUICK_CARDS.map((card) => (
            <div key={card.title} className="hero-feature-card group">
              <div className="hero-feature-card-icon">
                <card.icon className="h-5 w-5 text-[var(--brand-green)]" />
              </div>
              <h3 className="text-base font-semibold text-white sm:text-lg">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/90">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
