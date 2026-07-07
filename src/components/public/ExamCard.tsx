"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { EXAM_CATEGORY_LABELS } from "@/types";
import { whatsappLink } from "@/lib/helpers";

type ExamCardProps = {
  name: string;
  category: string;
  preparation: string;
  deliveryTime: string;
  notes?: string | null;
};

export function ExamCard({ name, category, preparation, deliveryTime, notes }: ExamCardProps) {
  const share = () => {
    const message = `Preparo para ${name}:\n${preparation}\nPrazo: ${deliveryTime}`;
    window.open(whatsappLink(message), "_blank");
  };

  return (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg text-[#0F3D4A]">{name}</CardTitle>
          <Badge variant="secondary" className="shrink-0 bg-[#DFF7F0] text-[#0F3D4A]">
            {EXAM_CATEGORY_LABELS[category] ?? category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <div>
          <p className="font-medium text-slate-700">Preparo</p>
          <p>{preparation}</p>
        </div>
        <div>
          <p className="font-medium text-slate-700">Prazo de entrega</p>
          <p>{deliveryTime}</p>
        </div>
        {notes && (
          <div>
            <p className="font-medium text-slate-700">Observações</p>
            <p>{notes}</p>
          </div>
        )}
        <Button size="sm" variant="outline" onClick={share} className="mt-2">
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar no WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}
