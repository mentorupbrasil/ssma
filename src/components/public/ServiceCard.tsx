import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ServiceCardProps = {
  name: string;
  description: string;
  audience?: string;
  deliveryTime?: string;
};

export function ServiceCard({ name, description, audience, deliveryTime }: ServiceCardProps) {
  return (
    <div className="page-feature-card group flex h-full flex-col">
      <h3 className="page-feature-card-title text-base">{name}</h3>
      <p className="page-feature-card-desc mt-2 flex-grow">{description}</p>
      {audience && (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          <span className="font-semibold text-slate-700">Indicado para:</span> {audience}
        </p>
      )}
      {deliveryTime && (
        <p className="mt-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Prazo médio:</span> {deliveryTime}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Link href="/contato?tipo=orcamento">
          <Button size="sm" variant="outline" className="rounded-lg">
            Solicitar orçamento
          </Button>
        </Link>
        <Link href="/encaminhamento-online">
          <Button size="sm" variant="brand" className="rounded-lg">
            Encaminhamento
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
