import { Shield } from "lucide-react";

import { EditorialHero } from "@/components/public/EditorialHero";
import { EDITORIAL_HERO_CONTENT } from "@/data/editorial-hero";

const content = EDITORIAL_HERO_CONTENT.encaminhamento;

export function EncaminhamentoHero() {
  return (
    <EditorialHero
      ctaPill={{ href: "#pre-encaminhamento", label: content.ctaLabel }}
      titleLines={content.titleLines}
      descriptionLines={content.descriptionLines}
    />
  );
}

export function EncaminhamentoInfoBox() {
  return (
    <div className="encaminhamento-info-box">
      <Shield className="h-5 w-5 shrink-0 text-[var(--brand-green)]" strokeWidth={1.75} />
      <p>
        Preencha os dados do colaborador e do exame solicitado. Nossa equipe confirma o
        atendimento e retorna com orientações sobre documentos e preparo, quando necessário.
      </p>
    </div>
  );
}
