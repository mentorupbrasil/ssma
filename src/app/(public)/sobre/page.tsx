import Link from "next/link";
import { Target, Eye, Heart, Stethoscope, Shield, Users } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { SectionTitle } from "@/components/public/SectionTitle";
import { HeroInstitutionalVisual } from "@/components/public/HeroInstitutionalVisual";
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
    text: "Oferecer soluções em saúde e segurança do trabalho com excelência, agilidade e atendimento personalizado às empresas.",
  },
  {
    icon: Eye,
    title: "Visão",
    text: "Ser referência regional em SST com tecnologia, conformidade legal e experiência superior para o RH.",
  },
  {
    icon: Heart,
    title: "Propósito",
    text: "Proteger vidas, reduzir riscos e ajudar empresas a manterem suas operações seguras e regulares.",
  },
];

const EXPERTISE = [
  {
    icon: Stethoscope,
    title: "Medicina do Trabalho",
    text: "Exames clínicos ocupacionais, ASO e programas conforme a legislação vigente.",
  },
  {
    icon: Shield,
    title: "Segurança do Trabalho",
    text: "Documentação técnica, laudos e suporte à gestão de riscos ocupacionais.",
  },
  {
    icon: Users,
    title: "Atendimento empresarial",
    text: "Equipe preparada para orientar RH, gestores e colaboradores em todo o fluxo.",
  },
];

export default function SobrePage() {
  const clinic = getClinicInfo();

  return (
    <>
      <PageHero
        eyebrow="Quem somos"
        title={`Sobre a ${clinic.name}`}
        description="Medicina e segurança do trabalho com estrutura física, equipe habilitada e portal digital para empresas."
      >
        <Link href="/contato?tipo=orcamento">
          <Button variant="brand" className="rounded-xl">
            Solicitar orçamento
          </Button>
        </Link>
      </PageHero>

      <PageSection>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          <div>
            <SectionTitle
              eyebrow="Nossa história"
              title="SST com foco em resultado para o RH"
              description="Combinamos atendimento clínico, documentação ocupacional e gestão digital para simplificar a rotina das empresas."
              align="left"
              className="!mb-0"
            />
            <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
              Atuamos com empresas de pequeno, médio e grande porte, oferecendo desde exames
              ocupacionais até programas de medicina e segurança do trabalho, sempre com atenção
              à conformidade legal e ao eSocial.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
              Nosso diferencial é unir estrutura presencial de qualidade com um portal
              empresarial real — encaminhamento online, acompanhamento de status e organização
              documental em um só lugar.
            </p>
          </div>
          <HeroInstitutionalVisual />
        </div>
      </PageSection>

      <PageSection variant="white">
        <SectionTitle
          title="Missão, visão e propósito"
          className="!mb-8 md:!mb-9"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {VALUES.map((v) => (
            <FeatureCard key={v.title} icon={v.icon} title={v.title} description={v.text} />
          ))}
        </div>
      </PageSection>

      <PageSection variant="muted">
        <SectionTitle
          title="Áreas de atuação"
          description="Equipe multidisciplinar dedicada ao atendimento ocupacional empresarial."
          className="!mb-8 md:!mb-9"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERTISE.map((item) => (
            <FeatureCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.text}
            />
          ))}
        </div>
      </PageSection>

      <CTASection
        title="Quer conhecer nossa estrutura e portal empresarial?"
        description="Agende uma visita ou fale com nossa equipe comercial."
        primaryLabel="Solicitar orçamento sem compromisso"
        secondaryHref={whatsappLink(
          `Olá! Gostaria de falar com um especialista da ${clinic.name}.`
        )}
        secondaryLabel="Falar com especialista"
      />
    </>
  );
}
