import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/public/SectionTitle";
import { HeroPortalMockup } from "@/components/public/HeroPortalMockup";
import { Button } from "@/components/ui/button";

export function PortalShowcase() {
  return (
    <section className="section-padding overflow-hidden">
      <div className="container-page">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionTitle
              eyebrow="Diferencial digital"
              title="Portal empresarial que funciona de verdade"
              description="Encaminhe colaboradores, acompanhe status em tempo real e organize documentos — sem depender de planilhas e ligações."
              align="left"
              className="mb-8"
            />

            <ul className="space-y-4">
              {[
                "Encaminhamento online com protocolo automático",
                "Acompanhamento de status por colaborador",
                "Histórico de exames e documentos",
                "Acesso exclusivo para o RH da empresa",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-green)]" />
                  <span className="text-sm leading-relaxed sm:text-base">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/empresas">
                <Button variant="brand" className="rounded-xl">
                  Conhecer o portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="rounded-xl">
                  Acessar painel
                </Button>
              </Link>
            </div>
          </div>

          <HeroPortalMockup variant="inline" />
        </div>
      </div>
    </section>
  );
}
