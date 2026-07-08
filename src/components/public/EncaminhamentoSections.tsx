"use client";

import Link from "next/link";
import {
  Building2,
  MessageCircle,
  Zap,
  Shield,
  FileCheck,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/helpers";
import { WHATSAPP_PRE_REFERRAL_TEMPLATE } from "@/data/pre-referral";
import { cn } from "@/lib/utils";

const TRUST_BADGES = [
  { icon: FileCheck, label: "Solicitação com protocolo" },
  { icon: MessageCircle, label: "Confirmação pelo WhatsApp" },
  { icon: Lock, label: "Tratamento seguro dos dados" },
];

type EncaminhamentoPathCardsProps = {
  onScrollToForm: () => void;
};

export function EncaminhamentoHero() {
  return (
    <section className="page-hero-offset scroll-mt-[var(--header-height)] relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-[var(--brand-navy)] via-[#124a5a] to-[#0f3d4a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,160,133,0.18),transparent_55%)]" />
      <div className="container-page relative pb-10 pt-1 md:pb-12 lg:pb-14">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
          PORTAL EMPRESARIAL
        </p>
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Encaminhamento rápido de colaborador
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200/95 sm:text-lg">
            Envie as informações principais e nossa equipe confirma o atendimento pelo WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TRUST_BADGES.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/95 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-emerald-300" strokeWidth={1.75} />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
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
