import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    <section className="bg-[#0F3D4A] py-16">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
        <p className="mt-4 text-lg text-slate-300">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={primaryHref}>
            <Button size="lg" className="bg-[#16A085] hover:bg-[#138d75]">
              {primaryLabel}
            </Button>
          </Link>
          <Link href={secondaryHref}>
            <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              {secondaryLabel}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
