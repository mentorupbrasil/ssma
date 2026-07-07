import Link from "next/link";
import {
  CheckCircle2,
  Building2,
  Users,
  FileText,
  Clock,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/PageHero";
import { SectionTitle } from "@/components/public/SectionTitle";
import { CTASection } from "@/components/public/CTASection";
import { PortalShowcase } from "@/components/public/PortalShowcase";
import { ComplianceSection } from "@/components/public/ComplianceSection";
import { PageSection } from "@/components/public/PageSection";
import { FeatureCard } from "@/components/public/FeatureCard";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

export const metadata = { title: "Empresas" };

const BENEFITS = [
  { icon: FileText, title: "Encaminhamento online", text: "Envie colaboradores para exame com protocolo automático." },
  { icon: Clock, title: "Status em tempo real", text: "Acompanhe cada etapa sem depender de ligações." },
  { icon: Users, title: "Histórico organizado", text: "Consulte atendimentos e documentos por colaborador." },
  { icon: Building2, title: "Documentos centralizados", text: "PCMSO, ASO e laudos com mais controle para o RH." },
  { icon: CheckCircle2, title: "Menos retrabalho", text: "Reduza planilhas, controles manuais e retrabalho operacional." },
  { icon: MessageSquare, title: "Comunicação ágil", text: "Canal direto com a clínica para demandas do dia a dia." },
];

const SIZES = [
  {
    title: "Pequenas empresas",
    desc: "Soluções acessíveis com atendimento personalizado e portal simplificado.",
  },
  {
    title: "Médias empresas",
    desc: "Gestão de múltiplos colaboradores com acompanhamento de status e documentos.",
  },
  {
    title: "Grandes empresas",
    desc: "Volume elevado, integração com SOC e suporte dedicado para o RH.",
  },
];

export default function EmpresasPage() {
  const clinic = getClinicInfo();

  return (
    <>
      <PageHero
        eyebrow="Para empresas"
        title="Sua empresa regularizada, organizada e com portal digital"
        description="Evite multas, organize encaminhamentos e acompanhe exames ocupacionais com login exclusivo para o RH."
      >
        <Link href="/contato?tipo=orcamento">
          <Button variant="brand" className="rounded-xl">
            Solicitar orçamento
          </Button>
        </Link>
        <Link href="/empresas#portal">
          <Button variant="outline-light" className="rounded-xl">
            Ver demonstração
          </Button>
        </Link>
      </PageHero>

      <PageSection>
        <SectionTitle
          title="Benefícios para sua empresa"
          description="Mais controle para o RH e mais previsibilidade na rotina ocupacional."
          className="!mb-8 md:!mb-9"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <FeatureCard key={b.title} icon={b.icon} title={b.title} description={b.text} />
          ))}
        </div>
      </PageSection>

      <div id="portal">
        <PortalShowcase />
      </div>

      <PageSection variant="white">
        <SectionTitle title="Atendimento por porte" className="!mb-8 md:!mb-9" />
        <div className="grid gap-4 md:grid-cols-3">
          {SIZES.map((s) => (
            <FeatureCard key={s.title} icon={Building2} title={s.title} description={s.desc} />
          ))}
        </div>
      </PageSection>

      <ComplianceSection />

      <PageSection variant="muted">
        <div className="mx-auto max-w-3xl">
          <SectionTitle
            title="Comece agora"
            description="Cadastre sua empresa, encaminhe colaboradores e acompanhe tudo pelo portal."
            className="!mb-6"
          />
          <div className="page-content-card bg-gradient-to-br from-white to-emerald-50/30">
            <ul className="space-y-2.5 text-sm text-slate-700">
              {[
                "Cadastrar colaboradores",
                "Emitir encaminhamentos online",
                "Acompanhar status dos exames",
                "Consultar preparo de exames",
                "Solicitar documentos",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--brand-green)]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/login">
                <Button variant="navy" className="rounded-xl">
                  Acessar portal
                </Button>
              </Link>
              <Link href="/encaminhamento-online">
                <Button variant="outline" className="rounded-xl">
                  Encaminhamento online
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PageSection>

      <CTASection
        title="Pronto para organizar a saúde ocupacional da sua empresa?"
        description="Fale com um especialista e receba uma proposta personalizada."
        primaryLabel="Solicitar orçamento sem compromisso"
        secondaryHref={whatsappLink(
          `Olá! Gostaria de falar com um especialista da ${clinic.name}.`
        )}
        secondaryLabel="Falar com especialista"
      />
    </>
  );
}
