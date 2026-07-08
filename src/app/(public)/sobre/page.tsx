import Link from "next/link";
import {
  Target,
  Eye,
  Heart,
  Stethoscope,
  Shield,
  Users,
  Building2,
  FileCheck,
  Workflow,
  Scale,
  FolderOpen,
  Lock,
} from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { SectionTitle } from "@/components/public/SectionTitle";
import { AboutClinicVisual } from "@/components/public/AboutClinicVisual";
import { CTASection } from "@/components/public/CTASection";
import { PageSection } from "@/components/public/PageSection";
import { FeatureCard } from "@/components/public/FeatureCard";
import { Button } from "@/components/ui/button";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

export const metadata = { title: "Sobre nós" };

const VALUES = [
  {
    icon: Target,
    title: "Missão",
    text: "Simplificar a gestão de Saúde e Segurança do Trabalho para empresas, unindo atendimento ocupacional, documentação legal e acompanhamento digital.",
  },
  {
    icon: Eye,
    title: "Visão",
    text: "Ser referência regional em Medicina e Segurança do Trabalho pela qualidade do atendimento, organização dos processos e uso inteligente da tecnologia.",
  },
  {
    icon: Heart,
    title: "Propósito",
    text: "Ajudar empresas a proteger pessoas, reduzir riscos e manter suas obrigações ocupacionais em dia com mais clareza e segurança.",
  },
];

const WORKFLOW = [
  {
    icon: Building2,
    title: "Atendimento orientado à empresa",
    text: "Entendemos a rotina do RH, prazos admissionais, periódicos e demandas legais para organizar melhor o fluxo ocupacional.",
  },
  {
    icon: FileCheck,
    title: "Documentação em dia",
    text: "Apoiamos a organização de ASO, PCMSO, PGR, LTCAT, PPP e eventos de SST no eSocial.",
  },
  {
    icon: Workflow,
    title: "Fluxo mais ágil",
    text: "Encaminhamentos online, acompanhamento de status e comunicação mais clara reduzem retrabalho.",
  },
  {
    icon: Stethoscope,
    title: "Estrutura preparada",
    text: "Ambiente adequado para atendimento ocupacional, exames e suporte às necessidades das empresas.",
  },
];

const EXPERTISE = [
  {
    icon: Stethoscope,
    title: "Medicina do Trabalho",
    text: "Exames clínicos ocupacionais, ASO e programas médicos para acompanhar a saúde dos colaboradores.",
    items: [
      "ASO admissional, periódico e demissional",
      "Retorno ao trabalho",
      "Mudança de função",
      "PCMSO",
    ],
  },
  {
    icon: Shield,
    title: "Segurança do Trabalho",
    text: "Documentação técnica, laudos e suporte para gestão dos riscos ocupacionais.",
    items: ["PGR", "LTCAT", "Laudos técnicos", "PPP", "eSocial SST"],
  },
  {
    icon: Users,
    title: "Atendimento empresarial",
    text: "Fluxo organizado para RH, gestores e colaboradores, com suporte presencial e digital.",
    items: [
      "Encaminhamento online",
      "Acompanhamento de status",
      "Portal empresarial",
      "Organização documental",
    ],
  },
];

const COMMITMENT = [
  { icon: Scale, title: "Conformidade legal" },
  { icon: FolderOpen, title: "Organização documental" },
  { icon: Lock, title: "Controle de acesso" },
];

export default function SobrePage() {
  const clinic = getClinicInfo();

  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title={`Sobre a ${clinic.name}`}
        description="Medicina e Segurança do Trabalho com estrutura, equipe habilitada e gestão digital para empresas."
        supportingText="Ajudamos empresas a manter exames, documentos ocupacionais e obrigações legais organizadas, com atendimento presencial e recursos digitais para facilitar a rotina do RH."
        layout="stack"
      >
        <Link href="/contato?tipo=orcamento">
          <Button variant="brand" className="rounded-xl">
            Solicitar orçamento
          </Button>
        </Link>
        <a
          href={whatsappLink(`Olá! Gostaria de falar com um especialista da ${clinic.name}.`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline-light" className="rounded-xl">
            Falar com especialista
          </Button>
        </a>
      </PageHero>

      <PageSection id="sobre-nos" className="about-section page-section-white">
        <div className="grid items-center gap-7 lg:grid-cols-2 lg:gap-9">
          <div>
            <SectionTitle
              title="SST com foco em resultado para o RH"
              description="Combinamos atendimento clínico, documentação ocupacional e gestão digital para simplificar a rotina das empresas."
              align="left"
              className="about-section-title !mb-0"
            />
            <div className="about-prose mt-4">
              <p>
                Atuamos no suporte a empresas de pequeno, médio e grande porte, oferecendo exames
                ocupacionais, programas e laudos de Medicina e Segurança do Trabalho, sempre com
                atenção à conformidade legal e às exigências do eSocial SST.
              </p>
              <p>
                Nosso diferencial é unir estrutura presencial de qualidade com um portal
                empresarial para encaminhamento online, acompanhamento de status e organização
                documental em um só lugar.
              </p>
            </div>
          </div>
          <AboutClinicVisual />
        </div>
      </PageSection>

      <PageSection id="forma-de-trabalhar" variant="muted" className="about-section">
        <SectionTitle
          title="Nossa forma de trabalhar"
          description="Processos pensados para apoiar o RH com clareza, organização e agilidade no dia a dia."
          className="about-section-title"
        />
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((item) => (
            <FeatureCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.text}
            />
          ))}
        </div>
      </PageSection>

      <PageSection
        id="missao-visao"
        variant="white"
        className="about-section about-values-section"
      >
        <SectionTitle
          title="Missão, visão e propósito"
          className="about-section-title about-values-section-title"
        />
        <div className="about-values-grid">
          {VALUES.map((v) => (
            <FeatureCard
              key={v.title}
              icon={v.icon}
              title={v.title}
              description={v.text}
              className="about-values-card"
            />
          ))}
        </div>
      </PageSection>

      <PageSection id="areas-atuacao" className="about-section about-expertise-section">
        <SectionTitle
          title="Áreas de atuação"
          description="Atuação integrada em Medicina do Trabalho, Segurança do Trabalho e gestão ocupacional para empresas."
          className="about-section-title about-expertise-section-title"
        />
        <div className="about-expertise-grid">
          {EXPERTISE.map((item) => (
            <FeatureCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.text}
              items={item.items}
              className="about-expertise-card"
            />
          ))}
        </div>
      </PageSection>

      <PageSection id="conformidade" variant="white" className="about-section">
        <SectionTitle
          title="Compromisso com conformidade e segurança"
          className="about-section-title"
        />
        <p className="about-commitment-copy">
          Dados ocupacionais exigem cuidado, organização e responsabilidade. Por isso, a
          plataforma deve considerar boas práticas de segurança, controle de acesso e tratamento
          adequado das informações.
        </p>
        <div className="about-commitment-grid">
          {COMMITMENT.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="about-commitment-card">
                <div className="about-commitment-card-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <p className="about-commitment-card-title">{item.title}</p>
              </div>
            );
          })}
        </div>
      </PageSection>

      <CTASection
        className="about-final-cta"
        title="Conheça uma forma mais organizada de cuidar da saúde ocupacional da sua empresa"
        description="Fale com um especialista e veja como unir atendimento presencial, documentos em dia e encaminhamento digital para sua empresa."
        primaryLabel="Solicitar orçamento sem compromisso"
        secondaryHref={whatsappLink(
          `Olá! Gostaria de falar com um especialista da ${clinic.name}.`
        )}
        secondaryLabel="Falar com especialista"
      />
    </>
  );
}
