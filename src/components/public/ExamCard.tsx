"use client";

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
    <div className="page-feature-card group flex h-full flex-col">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="page-feature-card-title text-base">{name}</h3>
        <Badge
          variant="secondary"
          className="shrink-0 border border-emerald-200/60 bg-emerald-50 text-[var(--brand-navy)]"
        >
          {EXAM_CATEGORY_LABELS[category] ?? category}
        </Badge>
      </div>
      <div className="space-y-2.5 text-sm text-slate-600">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preparo</p>
          <p className="mt-0.5 leading-relaxed">{preparation}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Prazo de entrega
          </p>
          <p className="mt-0.5">{deliveryTime}</p>
        </div>
        {notes && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Observações
            </p>
            <p className="mt-0.5 leading-relaxed">{notes}</p>
          </div>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={share} className="mt-4 w-full rounded-lg">
        <Share2 className="mr-2 h-4 w-4" />
        Compartilhar no WhatsApp
      </Button>
    </div>
  );
}
