"use client";

import Link from "next/link";
import {
  Building2,
  MessageCircle,
  Zap,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorialHero } from "@/components/public/EditorialHero";
import { EDITORIAL_HERO_CONTENT } from "@/data/editorial-hero";
import { WHATSAPP_PRE_REFERRAL_TEMPLATE } from "@/data/pre-referral";
import { whatsappLink } from "@/lib/helpers";
import { cn } from "@/lib/utils";

const content = EDITORIAL_HERO_CONTENT.encaminhamento;

type EncaminhamentoPathCardsProps = {
  onScrollToForm: () => void;
};

export function EncaminhamentoHero() {
  return (
    <EditorialHero
      ctaPill={{ href: "#pre-encaminhamento", label: content.ctaLabel }}
      titleLines={content.titleLines}
      descriptionLines={content.descriptionLines}
    />
  );
}

export function EncaminhamentoPathCards({ onScrollToForm }: EncaminhamentoPathCardsProps) {
  const cards = [
    {
      icon: Building2,
      title: "Já sou empresa cadastrada",
      description:
        "Acesse o portal empresarial para cadastrar colaboradores, emitir encaminhamentos e acompanhar status.",
      action: (
        <Link href="/login" className="block w-full">
          <Button variant="brand" className="encaminhamento-path-btn w-full rounded-xl">
            Acessar portal empresarial
          </Button>
        </Link>
      ),
      featured: false,
    },
    {
      icon: Zap,
      title: "Quero encaminhar rapidamente",
      description:
        "Preencha apenas os dados principais e nossa equipe confirma o atendimento.",
      action: (
        <Button
          type="button"
          variant="brand"
          className="encaminhamento-path-btn w-full rounded-xl"
          onClick={onScrollToForm}
        >
          Fazer pré-encaminhamento
        </Button>
      ),
      featured: true,
    },
    {
      icon: MessageCircle,
      title: "Prefiro enviar pelo WhatsApp",
      description:
        "Abra uma conversa com uma mensagem pronta para informar os dados do colaborador.",
      action: (
        <a
          href={whatsappLink(WHATSAPP_PRE_REFERRAL_TEMPLATE)}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <Button variant="outline" className="encaminhamento-path-btn w-full rounded-xl border-emerald-200 bg-white">
            Enviar pelo WhatsApp
          </Button>
        </a>
      ),
      featured: false,
    },
  ];

  return (
    <div className="encaminhamento-path-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={cn(
              "encaminhamento-path-card",
              card.featured && "encaminhamento-path-card-featured"
            )}
          >
            <div className="encaminhamento-path-icon">
              <Icon className="h-5 w-5 text-[var(--brand-green)]" strokeWidth={1.75} />
            </div>
            <h3 className="encaminhamento-path-title">{card.title}</h3>
            <p className="encaminhamento-path-desc">{card.description}</p>
            <div className="mt-auto pt-5">{card.action}</div>
          </div>
        );
      })}
    </div>
  );
}

export function EncaminhamentoInfoBox() {
  return (
    <div className="encaminhamento-info-box">
      <Shield className="h-5 w-5 shrink-0 text-[var(--brand-green)]" strokeWidth={1.75} />
      <p>
        Empresas cadastradas têm acesso ao portal completo, com histórico, status, documentos e
        acompanhamento por colaborador. O formulário público é indicado para solicitações rápidas
        ou empresas ainda sem acesso.
      </p>
    </div>
  );
}
