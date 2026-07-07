import Link from "next/link";
import { CheckCircle2, Building2, Users, FileText, Clock, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/public/PageHero";
import { SectionTitle } from "@/components/public/SectionTitle";
import { CTASection } from "@/components/public/CTASection";
import { PortalShowcase } from "@/components/public/PortalShowcase";
import { ComplianceSection } from "@/components/public/ComplianceSection";

export const metadata = { title: "Empresas" };

const BENEFITS = [
  { icon: FileText, text: "Encaminhamento online de colaboradores" },
  { icon: Clock, text: "Controle de exames por status" },
  { icon: Users, text: "Histórico de atendimentos" },
  { icon: Building2, text: "Documentos organizados" },
  { icon: CheckCircle2, text: "Redução de retrabalho" },
  { icon: MessageSquare, text: "Comunicação rápida com a clínica" },
];

const SIZES = [
  {
    title: "Pequenas empresas",
    desc: "Soluções acessíveis com atendimento personalizado e portal simplificado.",
  },
  {
    title: "Médias empresas",
    desc: "Gestão de múltiplos colaboradores com relatórios e acompanhamento de status.",
  },
  {
    title: "Grandes empresas",
    desc: "Volume alto, integração com SOC e suporte dedicado para RH.",
  },
];

export default function EmpresasPage() {
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
        <Link href="/login">
          <Button variant="outline-light" className="rounded-xl">
            Acessar portal
          </Button>
        </Link>
      </PageHero>

      <section className="section-padding">
        <div className="container-page">
          <SectionTitle title="Benefícios para sua empresa" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.text}
                className="premium-card-hover flex items-center gap-3 border-slate-200/80 p-5"
              >
                <b.icon className="h-6 w-6 shrink-0 text-[var(--brand-green)]" />
                <span className="font-medium text-[var(--brand-navy)]">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PortalShowcase />

      <section className="section-padding bg-white">
        <div className="container-page">
          <SectionTitle title="Atendimento por porte" />
          <div className="grid gap-6 md:grid-cols-3">
            {SIZES.map((s) => (
              <Card key={s.title} className="premium-card-hover border-slate-200/80">
                <CardContent className="pt-6">
                  <Building2 className="mb-4 h-8 w-8 text-[var(--brand-green)]" />
                  <h3 className="text-lg font-semibold text-[var(--brand-navy)]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <ComplianceSection />

      <section className="section-padding">
        <div className="container-page max-w-3xl">
          <SectionTitle
            title="Comece agora"
            description="Cadastre sua empresa, encaminhe colaboradores e acompanhe tudo pelo painel."
          />
          <div className="rounded-2xl border border-slate-200 bg-[var(--brand-mint)]/50 p-8">
            <ul className="space-y-3 text-slate-700">
              {[
                "Cadastrar colaboradores",
                "Emitir encaminhamentos online",
                "Acompanhar status dos exames",
                "Consultar preparo de exames",
                "Solicitar documentos",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[var(--brand-green)]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
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
      </section>

      <CTASection
        title="Pronto para organizar a saúde ocupacional da sua empresa?"
        description="Fale com um especialista e receba uma proposta personalizada."
        primaryLabel="Falar com especialista"
        primaryHref="/contato"
      />
    </>
  );
}
