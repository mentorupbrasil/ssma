import Image from "next/image";
import { Building2, FileCheck, Stethoscope } from "lucide-react";
import { siteMedia } from "@/config/media";
import { cn } from "@/lib/utils";

const FLOATING_CARDS = [
  { icon: FileCheck, label: "PCMSO e ASO", position: "top-left" as const },
  { icon: Stethoscope, label: "Exames ocupacionais", position: "top-right" as const },
  { icon: Building2, label: "Atendimento empresarial", position: "bottom-left" as const },
];

const POSITION_CLASS = {
  "top-left": "left-0 top-[12%] -translate-x-2 lg:-translate-x-5",
  "top-right": "right-0 top-[40%] translate-x-2 lg:translate-x-4",
  "bottom-left": "bottom-[12%] left-[6%]",
};

export function HeroInstitutionalVisual({ className }: { className?: string }) {
  const hasImage = Boolean(siteMedia.heroImage);

  return (
    <div className={cn("relative mx-auto w-full max-w-[22rem] lg:max-w-none", className)}>
      <div className="hero-visual-panel relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/12 shadow-[0_28px_56px_-20px_rgba(0,0,0,0.4)] sm:max-w-md lg:max-w-none lg:aspect-[5/6]">
        {hasImage ? (
          <Image
            src={siteMedia.heroImage}
            alt="Estrutura e atendimento da clínica"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 90vw, 400px"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a5568] via-[#0f3d4a] to-[#0a2f3a]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_25%,rgba(22,160,133,0.15),transparent_55%)]" />
            <div className="absolute right-[-10%] top-[18%] h-40 w-40 rounded-full border border-white/[0.05] bg-white/[0.02]" />
            <div className="absolute bottom-[22%] left-[-6%] h-28 w-28 rounded-full border border-emerald-400/[0.08] bg-emerald-400/[0.03]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <Stethoscope className="h-7 w-7 text-[var(--brand-green)]/75" strokeWidth={1.25} />
              </div>
              <div className="max-w-[200px] space-y-1.5">
                <p className="text-sm font-medium text-white/85">Medicina do Trabalho</p>
                <p className="text-xs leading-relaxed text-slate-400/90">
                  Atendimento ocupacional com padrão clínico
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0a2f3a]/50 to-transparent" />
      </div>

      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        {FLOATING_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn("hero-float-card absolute max-w-[9.75rem]", POSITION_CLASS[card.position])}
            >
              <Icon className="mb-1.5 h-3.5 w-3.5 text-[var(--brand-green)]" strokeWidth={1.5} />
              <span>{card.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2 sm:hidden">
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
