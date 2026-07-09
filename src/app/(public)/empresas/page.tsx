import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmpresasHero } from "@/components/public/EmpresasHero";
import { EmpresasStartSection } from "@/components/public/EmpresasStartSection";
import { PortalShowcase } from "@/components/public/PortalShowcase";
import { EmpresasComplianceSection } from "@/components/public/EmpresasComplianceSection";
import { EmpresasPorteSection } from "@/components/public/EmpresasPorteSection";
import { PageSection } from "@/components/public/PageSection";
import { CTASection } from "@/components/public/CTASection";

import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.empresas);

const BENEFIT_STATS = [
  { value: "6", label: "benefícios diretos para o dia a dia do RH" },
  { value: "3", label: "portes de empresa atendidos, do pequeno ao grande" },
  { value: "100%", label: "do encaminhamento feito online, sem papel" },
] as const;

const BENEFITS = [
  {
    title: "Encaminhamento online",
    text: "Envie colaboradores para exame com protocolo automático e informações organizadas.",
  },
  {
    title: "Status em tempo real",
    text: "Acompanhe cada etapa sem depender de ligações, mensagens soltas ou planilhas.",
  },
  {
    title: "Histórico organizado",
    text: "Consulte atendimentos, exames e documentos por colaborador sempre que precisar.",
  },
  {
    title: "Documentos centralizados",
    text: "PCMSO, ASO, laudos e registros ocupacionais com mais controle para o RH.",
  },
  {
    title: "Menos retrabalho",
    text: "Reduza planilhas, controles manuais e retrabalho operacional no dia a dia.",
  },
  {
    title: "Comunicação ágil",
    text: "Canal direto com a clínica para demandas, dúvidas e acompanhamento dos atendimentos.",
  },
];

export default function EmpresasPage() {
  return (
    <>
      <EmpresasHero />

      <PageSection className="empresas-benefits-section">
        <div className="home-why-panel">
          <div className="home-why-header">
            <p className="home-why-eyebrow">Benefícios</p>
            <h2 className="home-why-title">Benefícios para sua empresa</h2>
            <p className="home-why-desc">
              Mais controle para o RH e mais previsibilidade na rotina ocupacional.
            </p>
          </div>

          <dl className="home-why-stats">
            {BENEFIT_STATS.map((stat) => (
              <div key={stat.label} className="home-why-stat">
                <dt className="home-why-stat-value">{stat.value}</dt>
                <dd className="home-why-stat-label">{stat.label}</dd>
              </div>
            ))}
          </dl>

          <ul className="home-why-checklist">
            {BENEFITS.map((benefit) => (
              <li key={benefit.title} className="home-why-check-item">
                <CheckCircle2 className="home-why-check-icon" strokeWidth={1.75} aria-hidden />
                <div>
                  <p className="home-why-check-title">{benefit.title}</p>
                  <p className="home-why-check-desc">{benefit.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="empresas-benefits-cta">
          <p className="empresas-benefits-cta-text">
            Quer ver como o portal pode organizar a rotina do seu RH?
          </p>
          <div className="empresas-benefits-cta-actions">
            <Link href="/empresas#portal">
              <Button variant="outline" className="rounded-xl">
                Ver demonstração
              </Button>
            </Link>
            <Link href="/contato?tipo=orcamento">
              <Button variant="brand" className="rounded-xl">
                Solicitar orçamento
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </PageSection>

      <div id="portal">
        <PortalShowcase
          demoMode
          primaryHref="/login"
          secondaryHref="#portal-demo"
        />
      </div>

      <EmpresasPorteSection />

      <EmpresasComplianceSection />

      <EmpresasStartSection />

      <CTASection
        title="Pronto para organizar a SST da sua empresa?"
        description="Solicite um orçamento personalizado ou comece pelo encaminhamento online com protocolo automático."
        primaryHref="/contato?tipo=orcamento"
        primaryLabel="Solicitar orçamento"
        secondaryHref="/encaminhamento-online"
        secondaryLabel="Encaminhamento online"
      />
    </>
  );
}
