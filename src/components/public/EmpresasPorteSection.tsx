import { Building2, Factory, ShieldAlert, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionTitle } from "@/components/public/SectionTitle";
import { FeatureCard } from "@/components/public/FeatureCard";
import { PageSection } from "@/components/public/PageSection";
import { Button } from "@/components/ui/button";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

const PORTE_CARDS: {
  icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
}[] = [
  {
    icon: Building2,
    title: "Pequenas empresas",
    description:
      "Regularização ocupacional simples, acessível e organizada para empresas que precisam cumprir as exigências básicas de SST.",
    items: [
      "ASO admissional, periódico e demissional",
      "PCMSO e documentos essenciais",
      "Encaminhamento online simplificado",
      "Suporte para dúvidas do RH",
    ],
  },
  {
    icon: Users,
    title: "Médias empresas",
    description:
      "Mais controle para empresas com maior volume de colaboradores, exames recorrentes e necessidade de acompanhamento por status.",
    items: [
      "Controle de periódicos",
      "Histórico por colaborador",
      "Documentos centralizados",
      "Acompanhamento de encaminhamentos",
    ],
  },
  {
    icon: Factory,
    title: "Grandes empresas",
    description:
      "Estrutura para operações com alto volume, integração com fluxos de RH e suporte dedicado para demandas ocupacionais.",
    items: [
      "Suporte a múltiplos setores",
      "Integração com SOC ou fluxos internos",
      "Relatórios e acompanhamento recorrente",
      "Atendimento empresarial dedicado",
    ],
  },
];

export function EmpresasPorteSection() {
  const clinic = getClinicInfo();

  return (
    <PageSection variant="white" className="empresas-porte-section">
      <SectionTitle
        title="Atendimento por porte"
        description="Soluções adaptadas para empresas de pequeno, médio e grande porte, com fluxo ocupacional mais organizado para o RH."
        className="empresas-porte-title !mb-6 md:!mb-7"
      />

      <div className="empresas-porte-grid">
        {PORTE_CARDS.map((card) => (
          <FeatureCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            description={card.description}
            items={card.items}
            className="empresas-porte-card"
          />
        ))}
      </div>

      <div className="empresas-porte-alert">
        <div className="empresas-porte-alert-content">
          <div className="empresas-porte-alert-icon" aria-hidden>
            <ShieldAlert className="h-5 w-5 text-amber-700" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="empresas-porte-alert-title">Evite multas e autuações</p>
            <p className="empresas-porte-alert-text">
              Empresas sem exames, laudos e eventos de SST organizados podem enfrentar penalidades
              em fiscalizações e inconsistências no eSocial.
            </p>
          </div>
        </div>
        <a
          href={whatsappLink(
            `Olá! Gostaria de falar com um especialista em SST da ${clinic.name}.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="empresas-porte-alert-action"
        >
          <Button variant="outline" size="sm" className="empresas-porte-alert-btn w-full sm:w-auto">
            Falar com especialista
          </Button>
        </a>
      </div>
    </PageSection>
  );
}
