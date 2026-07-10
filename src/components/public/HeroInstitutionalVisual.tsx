import Image from "next/image";
import { Building2, FileCheck, Shield, Stethoscope } from "lucide-react";
import { siteMedia } from "@/config/media";
import { cn } from "@/lib/utils";

const FLOATING_CARDS = [
  { icon: FileCheck, label: "PCMSO e ASO", position: "top-left" as const },
  { icon: Stethoscope, label: "Exames ocupacionais", position: "top-right" as const },
  { icon: Building2, label: "Atendimento empresarial", position: "bottom-right" as const },
];

const POSITION_CLASS = {
  "top-left": "left-[-4%] top-[8%] lg:left-[-6%]",
  "top-right": "right-[-2%] top-[32%] lg:right-[-4%]",
  "bottom-right": "bottom-[10%] right-[4%] lg:right-[2%]",
};

export function HeroInstitutionalVisual({ className }: { className?: string }) {
  const hasImage = Boolean(siteMedia.heroImage);

  return (
    <div className={cn("relative mx-auto w-full max-w-[20rem] lg:max-w-none", className)}>
      {/* Accent ring behind panel */}
      <div className="pointer-events-none absolute -inset-3 rounded-[1.35rem] border border-white/[0.04] bg-gradient-to-br from-emerald-400/[0.04] to-transparent lg:-inset-4" />

      <div className="hero-visual-panel relative aspect-[5/4] overflow-hidden rounded-2xl border border-white/14 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.45)] sm:max-w-sm lg:max-w-none lg:aspect-[4/3]">
        {hasImage ? (
          <Image
            src={siteMedia.heroImage}
            alt="Estrutura e atendimento da clínica"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 90vw, 380px"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#16204a] via-[#0e142b] to-[#080d1c]">
            {/* Layered abstract composition */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_30%,rgba(22,160,133,0.2),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_75%,rgba(22,160,133,0.08),transparent_45%)]" />
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="absolute left-[12%] top-[15%] h-px w-[35%] bg-gradient-to-r from-emerald-400/30 to-transparent" />
            <div className="absolute bottom-[28%] right-[10%] h-px w-[28%] bg-gradient-to-l from-white/15 to-transparent" />
            <div className="absolute right-[-8%] top-[12%] h-36 w-36 rounded-full border border-white/[0.06] bg-white/[0.02]" />
            <div className="absolute bottom-[18%] left-[-5%] h-24 w-24 rounded-full border border-emerald-400/10 bg-emerald-400/[0.04]" />
            <div className="absolute right-[18%] top-[22%] h-2 w-2 rounded-full bg-emerald-400/40" />
            <div className="absolute bottom-[38%] left-[22%] h-1.5 w-1.5 rounded-full bg-white/20" />

            {/* Central focal cluster */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex flex-col items-center gap-4 px-6 text-center">
                <div className="absolute -inset-8 rounded-full border border-white/[0.04] bg-white/[0.02]" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/12 bg-white/[0.07] shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
                  <Stethoscope className="h-6 w-6 text-[var(--brand-green)]" strokeWidth={1.5} />
                </div>
                <div className="relative max-w-[180px] space-y-1">
                  <p className="text-[0.8rem] font-medium tracking-wide text-white/90">
                    Medicina do Trabalho
                  </p>
                  <p className="text-[0.7rem] leading-snug text-slate-300/80">
                    Atendimento ocupacional com padrão clínico
                  </p>
                </div>
                <div className="relative flex items-center gap-3 pt-1">
                  <Shield className="h-3.5 w-3.5 text-emerald-400/60" strokeWidth={1.5} />
                  <span className="h-px w-8 bg-white/10" />
                  <FileCheck className="h-3.5 w-3.5 text-emerald-400/60" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top accent bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a2f3a]/55 to-transparent" />
      </div>

      {/* Floating cards */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        {FLOATING_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn("hero-float-card absolute max-w-[9.5rem]", POSITION_CLASS[card.position])}
            >
              <Icon className="mb-1 h-3.5 w-3.5 text-[var(--brand-green)]" strokeWidth={1.75} />
              <span>{card.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap justify-center gap-2 sm:hidden">
        {FLOATING_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <span
              key={card.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[0.65rem] font-medium text-slate-300"
            >
              <Icon className="h-3 w-3 text-[var(--brand-green)]" strokeWidth={1.5} />
              {card.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
