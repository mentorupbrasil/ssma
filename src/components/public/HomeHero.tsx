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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(22,160,133,0.14),transparent_50%)]" />
      <div className="absolute -right-32 top-24 h-72 w-72 rounded-full bg-[var(--brand-green)]/[0.07] blur-3xl" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />

      <div className="container-page relative">
        <div className="hero-main-grid grid items-start gap-8 pb-7 sm:items-center lg:grid-cols-2 lg:items-center lg:gap-10 lg:pb-8 xl:gap-14">
          <div className="animate-fade-up order-2 lg:order-1 lg:self-center">
            <p className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-emerald-100/90 sm:text-sm">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--brand-green)]" />
              Saúde e Segurança do Trabalho · Atendimento empresarial
            </p>

            <h1 className="max-w-xl text-[1.85rem] font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.35rem] lg:leading-[1.12] xl:text-[2.5rem]">
              Regularize sua empresa e evite{" "}
              <span className="text-gradient-hero">multas na fiscalização</span>
            </h1>

            <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-slate-300/95 sm:text-base lg:text-[1rem] lg:leading-relaxed">
              Da admissão ao desligamento, sua empresa com PCMSO, ASO e toda a documentação
              ocupacional organizada — acompanhada em tempo real por um portal que o RH realmente
              usa no dia a dia.
            </p>

            <div className="mt-3.5 flex flex-wrap gap-2">
              {CHIPS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[0.7rem] font-medium text-slate-300 sm:text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink(
                  `Olá! Gostaria de falar com um especialista em SST da ${clinic.name}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:flex-1 sm:flex-none"
              >
                <Button variant="brand" size="lg" className="w-full rounded-xl sm:w-auto sm:min-w-[200px]">
                  <Phone className="mr-2 h-4 w-4" />
                  Falar com especialista
                </Button>
              </a>
              <Link href="/contato?tipo=orcamento" className="sm:flex-1 sm:flex-none">
                <Button variant="outline-light" size="lg" className="w-full rounded-xl sm:w-auto sm:min-w-[200px]">
                  Solicitar orçamento
                </Button>
              </Link>
            </div>

            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.08] pt-4">
              {TRUST_ITEMS.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-2 text-xs text-slate-400 sm:text-sm">
                  <item.icon className="h-3.5 w-3.5 text-[var(--brand-green)]/80" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-up-delay order-1 flex justify-center lg:order-2 lg:justify-end lg:self-center lg:pl-2 xl:pl-6">
            <div className="relative w-full max-w-[26rem]">
              <div
                className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(22,160,133,0.16),transparent_65%)] blur-2xl"
                aria-hidden
              />

              <span className="hero-float-card absolute -left-6 -top-5 z-10 hidden lg:flex">
                <BadgeCheck className="mb-1 h-3.5 w-3.5 shrink-0 text-[var(--brand-green)]" strokeWidth={1.75} />
                Protocolo automático a cada encaminhamento
              </span>

              <span className="hero-float-card absolute -bottom-5 -right-4 z-10 hidden max-w-[10rem] lg:flex">
                <Lock className="mb-1 h-3.5 w-3.5 shrink-0 text-[var(--brand-green)]" strokeWidth={1.75} />
                Dados de colaboradores protegidos conforme a LGPD
              </span>

              <div className="home-hero-mockup relative">
                <HeroPortalMockup variant="hero" demoMode />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/[0.08] pt-7 pb-9 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-4 lg:pb-10">
          {QUICK_CARDS.map((card) => (
            <div key={card.title} className="hero-feature-card">
              <span className="hero-feature-card-icon">
                <card.icon strokeWidth={2} />
              </span>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
