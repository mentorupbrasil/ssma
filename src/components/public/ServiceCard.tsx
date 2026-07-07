import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type ServiceCardProps = {
  name: string;
  description: string;
  audience?: string;
  deliveryTime?: string;
};

export function ServiceCard({ name, description, audience, deliveryTime }: ServiceCardProps) {
  return (
    <Card className="premium-card-hover group h-full border-slate-200/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-[var(--brand-navy)] transition group-hover:text-[var(--brand-green)]">
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
        {audience && (
          <p className="text-xs leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-700">Indicado para:</span> {audience}
          </p>
        )}
        {deliveryTime && (
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Prazo médio:</span> {deliveryTime}
          </p>
        )}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
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
      </CardContent>
    </Card>
  );
}
