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
    <Card className="group h-full border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg text-[#0F3D4A]">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">{description}</p>
        {audience && (
          <p className="text-xs text-slate-500">
            <span className="font-medium">Indicado para:</span> {audience}
          </p>
        )}
        {deliveryTime && (
          <p className="text-xs text-slate-500">
            <span className="font-medium">Prazo médio:</span> {deliveryTime}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/contato?tipo=orcamento">
            <Button size="sm" variant="outline">Solicitar orçamento</Button>
          </Link>
          <Link href="/encaminhamento-online">
            <Button size="sm" className="bg-[#16A085] hover:bg-[#138d75]">
              Encaminhamento
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
