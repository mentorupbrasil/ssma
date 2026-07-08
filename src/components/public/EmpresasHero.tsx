import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmpresasPortalMockup } from "@/components/public/EmpresasPortalMockup";
import { cn } from "@/lib/utils";

const HERO_CHIPS = [
  "Encaminhamento online",
  "Status em tempo real",
  "Documentos centralizados",
  "Portal do RH",
] as const;

type EmpresasHeroProps = {
  className?: string;
};

export function EmpresasHero({ className }: EmpresasHeroProps) {
  return (
    <section
      className={cn(
        "empresas-hero page-hero-offset scroll-mt-[var(--header-height)] relative overflow-hidden border-b border-slate-200/80",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-navy)] via-[#124a5a] to-[#0f3d4a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,160,133,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-60" />

      <div className="container-page relative py-6 md:py-7 lg:py-8">
        <div className="empresas-hero-grid">
          <div className="empresas-hero-content">
            <p className="empresas-hero-badge">Para empresas</p>
            <h1 className="empresas-hero-title">
              Sua empresa regularizada, organizada e com portal digital
            </h1>
            <p className="empresas-hero-desc">
              Evite multas, organize encaminhamentos e acompanhe exames ocupacionais com acesso
              exclusivo para o RH.
            </p>

            <ul className="empresas-hero-chips" aria-label="Recursos do portal empresarial">
              {HERO_CHIPS.map((chip) => (
                <li key={chip} className="empresas-hero-chip">
                  {chip}
                </li>
              ))}
            </ul>

            <div className="empresas-hero-actions">
              <Link href="/contato?tipo=orcamento">
                <Button variant="brand" className="rounded-xl">
                  Solicitar orçamento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/empresas#portal">
                <Button
                  variant="outline"
                  className="rounded-xl border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Ver demonstração
                </Button>
              </Link>
            </div>
          </div>

          <div className="empresas-hero-visual">
            <EmpresasPortalMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
