import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmpresasHero } from "@/components/public/EmpresasHero";
import { SectionTitle } from "@/components/public/SectionTitle";
import { EmpresasStartSection } from "@/components/public/EmpresasStartSection";
import { PortalShowcase } from "@/components/public/PortalShowcase";
import { EmpresasComplianceSection } from "@/components/public/EmpresasComplianceSection";
import { EmpresasPorteSection } from "@/components/public/EmpresasPorteSection";
import { PageSection } from "@/components/public/PageSection";
import { FeatureCard } from "@/components/public/FeatureCard";
import { CTASection } from "@/components/public/CTASection";

import { createPageMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata(PUBLIC_PAGE_SEO.empresas);

const BENEFITS = [
  {
    icon: FileText,
    title: "Encaminhamento online",
    text: "Envie colaboradores para exame com protocolo automático e informações organizadas.",
  },
  {
    icon: Clock,
    title: "Status em tempo real",
    text: "Acompanhe cada etapa sem depender de ligações, mensagens soltas ou planilhas.",
  },
  {
    icon: Users,
    title: "Histórico organizado",
    text: "Consulte atendimentos, exames e documentos por colaborador sempre que precisar.",
  },
  {
    icon: Building2,
    title: "Documentos centralizados",
    text: "PCMSO, ASO, laudos e registros ocupacionais com mais controle para o RH.",
  },
  {
    icon: CheckCircle2,
    title: "Menos retrabalho",
    text: "Reduza planilhas, controles manuais e retrabalho operacional no dia a dia.",
  },
  {
    icon: MessageSquare,
    title: "Comunicação ágil",
    text: "Canal direto com a clínica para demandas, dúvidas e acompanhamento dos atendimentos.",
  },
];

export default function EmpresasPage() {
  return (
    <>
      <EmpresasHero />

      <PageSection className="empresas-benefits-section">
        <SectionTitle
          title="Benefícios para sua empresa"
          description="Mais controle para o RH e mais previsibilidade na rotina ocupacional."
          className="empresas-benefits-title !mb-7 md:!mb-8"
        />
        <div className="empresas-benefits-grid">
          {BENEFITS.map((benefit) => (
            <FeatureCard
              key={benefit.title}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.text}
              className="empresas-benefit-card"
            />
          ))}
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
