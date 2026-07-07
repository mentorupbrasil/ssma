import Link from "next/link";
import { Target, Eye, Heart } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { SectionTitle } from "@/components/public/SectionTitle";
import { MediaPlaceholder } from "@/components/public/MediaPlaceholder";
import { CTASection } from "@/components/public/CTASection";
import { Button } from "@/components/ui/button";
import { siteMedia } from "@/config/media";
import { getClinicInfo } from "@/lib/helpers";

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

      <section className="section-padding">
        <div className="container-page">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionTitle
                eyebrow="Nossa história"
                title="SST com foco em resultado para o RH"
                description="Combinamos atendimento clínico, documentação ocupacional e gestão digital para simplificar a rotina das empresas."
                align="left"
                className="mb-0"
              />
              <p className="mt-6 text-sm leading-relaxed text-slate-600 sm:text-base">
                Atuamos com empresas de pequeno, médio e grande porte, oferecendo desde exames
                ocupacionais até programas de medicina e segurança do trabalho, sempre com
                atenção à conformidade legal e ao eSocial.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Nosso diferencial é unir estrutura presencial de qualidade com um portal
                empresarial real — encaminhamento online, acompanhamento de status e organização
                documental em um só lugar.
              </p>
            </div>
            <MediaPlaceholder
              label="Foto da equipe ou fachada"
              hint="Preencha siteMedia.heroImage ou adicione foto em /public/images/sobre/"
              src={siteMedia.heroImage || undefined}
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-page">
          <SectionTitle title="Missão, visão e propósito" />
          <div className="grid gap-6 md:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="premium-card border-slate-200/80 p-6">
                <v.icon className="mb-4 h-8 w-8 text-[var(--brand-green)]" />
                <h3 className="text-lg font-semibold text-[var(--brand-navy)]">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page">
          <SectionTitle
            title="Equipe multidisciplinar"
            description="Substitua nomes e fotos em src/config/media.ts quando tiver o material."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {siteMedia.aboutTeam.map((member) => (
              <div
                key={member.role}
                className="premium-card overflow-hidden border-slate-200/80"
              >
                <MediaPlaceholder
                  label={member.name}
                  src={member.src || undefined}
                  hint="/public/images/equipe/"
                  className="!rounded-none !rounded-t-2xl !border-0 !border-b"
                />
                <div className="p-5">
                  <h3 className="font-semibold text-[var(--brand-navy)]">{member.name}</h3>
                  <p className="text-sm text-[var(--brand-green)]">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Quer conhecer nossa estrutura e portal empresarial?"
        description="Agende uma visita ou fale com nossa equipe comercial."
        primaryLabel="Falar com especialista"
        primaryHref="/contato"
        secondaryHref="/instalacoes"
        secondaryLabel="Ver instalações"
      />
    </>
  );
}
