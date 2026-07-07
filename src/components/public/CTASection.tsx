import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type CTASectionProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CTASection({
  title,
  description,
  primaryHref = "/contato?tipo=orcamento",
  primaryLabel = "Solicitar orçamento",
  secondaryHref = "/encaminhamento-online",
  secondaryLabel = "Fazer encaminhamento",
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--brand-navy)] py-20 md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(22,160,133,0.2),transparent_60%)]" />
      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">{title}</h2>
          <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">{description}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={primaryHref}>
              <Button variant="brand" size="lg" className="min-w-[220px] rounded-xl">
                {primaryLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href={secondaryHref}>
              <Button variant="outline-light" size="lg" className="min-w-[220px] rounded-xl">
                {secondaryLabel}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
