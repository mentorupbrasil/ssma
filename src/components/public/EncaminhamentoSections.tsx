"use client";

import Link from "next/link";
import {
  Building2,
  MessageCircle,
  Zap,
  Shield,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AboutCtaLink } from "@/components/public/about/AboutCtaLink";
import { EditorialHero } from "@/components/public/EditorialHero";
import { whatsappLink } from "@/lib/helpers";
import { ENCAMINHAMENTO_HERO_BADGES, WHATSAPP_PRE_REFERRAL_TEMPLATE } from "@/data/pre-referral";
import { cn } from "@/lib/utils";

type EncaminhamentoPathCardsProps = {
  onScrollToForm: () => void;
};

export function EncaminhamentoHero() {
  return (
    <EditorialHero
      pill={{ href: "#pre-encaminhamento", label: "Portal empresarial" }}
      title="Encaminhamento rápido de colaborador"
      description="Envie as informações principais e nossa equipe confirma o atendimento pelo WhatsApp."
      badges={ENCAMINHAMENTO_HERO_BADGES}
      badgesAriaLabel="Benefícios do encaminhamento"
      actions={
        <>
          <AboutCtaLink
            href="#pre-encaminhamento"
            variant="brand"
            size="default"
            className="about-v2-hero-cta about-v2-hero-cta-primary group"
          >
            <ClipboardList className="size-4" aria-hidden />
            Preencher formulário
          </AboutCtaLink>
          <AboutCtaLink
            href="/login"
            variant="outline"
            size="default"
            className="about-v2-hero-cta about-v2-hero-cta-secondary group"
          >
            Acessar portal
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </AboutCtaLink>
        </>
      }
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
