import Link from "next/link";
import {
  Shield,
  Stethoscope,
  FileCheck,
  HardHat,
  Clock,
  Users,
  Building2,
  FlaskConical,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  BadgeCheck,
  Zap,
  Lock,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/public/SectionTitle";
import { CTASection } from "@/components/public/CTASection";
import { ComplianceSection } from "@/components/public/ComplianceSection";
import { PortalShowcase } from "@/components/public/PortalShowcase";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { TopClinicalExams } from "@/components/public/TopClinicalExams";
import { MediaPlaceholder } from "@/components/public/MediaPlaceholder";
import { FAQ_ITEMS } from "@/data/services";
import { TRUST_PILLARS } from "@/data/marketing";
import { siteMedia } from "@/config/media";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

const QUICK_CARDS = [
  { icon: FileCheck, title: "PCMSO", desc: "Programa completo conforme NR-7" },
  { icon: Stethoscope, title: "ASO", desc: "Todos os tipos legais de exame clínico" },
  { icon: FlaskConical, title: "Exames", desc: "Laboratório e complementares integrados" },
  { icon: HardHat, title: "SST", desc: "PGR, LTCAT, laudos e segurança do trabalho" },
];

const STEPS = [
  { title: "Primeiro contato", desc: "Você solicita orçamento ou fala com nosso especialista." },
  { title: "Diagnóstico", desc: "Analisamos riscos, porte e necessidades da sua empresa." },
  { title: "Proposta", desc: "Montamos um plano sob medida com prazos claros." },
  { title: "Execução digital", desc: "Encaminhamentos, exames e acompanhamento pelo portal." },
];

const DIFFERENTIALS = [
  { icon: Clock, title: "Atendimento ágil", desc: "Fluxo organizado para o RH, sem filas desnecessárias." },
  { icon: Users, title: "Equipe especializada", desc: "Médicos e técnicos com foco em medicina ocupacional." },
  { icon: Building2, title: "Estrutura completa", desc: "Ambiente climatizado e preparado para exames." },
  { icon: FlaskConical, title: "Laboratório integrado", desc: "Resultados mais rápidos e processo unificado." },
  { icon: Smartphone, title: "Portal empresarial", desc: "Encaminhamento e status online — diferencial real." },
  { icon: Shield, title: "Conformidade legal", desc: "PCMSO, ASO, eSocial e documentação em dia." },
];

export default async function HomePage() {
  const clinic = getClinicInfo();
  const exams = await prisma.exam.findMany({ where: { active: true }, take: 6 });

  return (
    <>
      {/* Hero — copy de conversão */}
      <section className="relative overflow-hidden bg-[var(--brand-navy)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,160,133,0.22),transparent_55%)]" />
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-[var(--brand-green)]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

        <div className="container-page relative py-16 md:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="animate-fade-up">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-100 backdrop-blur">
                <BadgeCheck className="h-4 w-4 text-[var(--brand-green)]" />
                Saúde e Segurança do Trabalho · Atendimento empresarial
              </p>
              <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.15rem]">
                Regularize sua empresa e evite{" "}
                <span className="text-gradient-hero">multas na fiscalização</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                PCMSO, ASO, exames ocupacionais e portal digital para o RH — com conformidade
                legal, laudos em dia e suporte ao eSocial SST.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-300">
                {["Pequeno, médio e grande porte", "Profissionais habilitados", "Portal empresarial"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={whatsappLink(
                    "Olá! Gostaria de falar com um especialista em SST da clínica."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="brand" size="lg" className="w-full rounded-xl sm:w-auto">
                    <Phone className="mr-2 h-4 w-4" />
                    Falar com especialista
                  </Button>
                </a>
                <Link href="/contato?tipo=orcamento">
                  <Button variant="outline-light" size="lg" className="w-full rounded-xl sm:w-auto">
                    Solicitar orçamento
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[var(--brand-green)]" /> LGPD
                </span>
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[var(--brand-green)]" /> Encaminhamento digital
                </span>
                <span className="inline-flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[var(--brand-green)]" /> Conformidade NR-7
                </span>
              </div>
            </div>

            <div className="animate-fade-up-delay">
              <MediaPlaceholder
                label="Foto ou vídeo da clínica"
                hint="Coloque em src/config/media.ts → heroImage ou heroVideo"
                src={siteMedia.heroImage || undefined}
                variant={siteMedia.heroVideo ? "video" : "photo"}
                className="shadow-[var(--shadow-elevated)]"
              />
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_CARDS.map((card) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-[var(--brand-green)]/30 hover:bg-white/10"
              >
                <div className="mb-3 inline-flex rounded-xl bg-[var(--brand-green)]/15 p-2.5">
                  <card.icon className="h-5 w-5 text-[var(--brand-green)]" />
                </div>
                <h3 className="font-semibold text-white">{card.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ComplianceSection />
      <PortalShowcase />

      <section className="section-padding">
        <div className="container-page">
          <SectionTitle
            eyebrow="Por que nos escolher"
            title={`${clinic.name} — SST com tecnologia e confiança`}
            description="Unimos atendimento clínico de qualidade com gestão digital para empresas."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_PILLARS.map((p) => (
              <div key={p.title} className="premium-card-hover border-slate-200/80 p-5 text-center">
                <h3 className="font-semibold text-[var(--brand-navy)]">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TopClinicalExams />

      <section className="section-padding bg-white">
        <div className="container-page">
          <SectionTitle eyebrow="Processo" title="Como funciona na prática" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-green-light)] text-lg font-bold text-[var(--brand-navy)]">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-[var(--brand-navy)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page">
          <SectionTitle
            eyebrow="Diferenciais"
            title="O que nos diferencia no mercado"
            description="Estrutura física + portal digital integrado — não é só promessa, é produto."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DIFFERENTIALS.map((d) => (
              <Card key={d.title} className="premium-card-hover border-slate-200/80">
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex rounded-xl bg-[var(--brand-green-light)] p-3">
                    <d.icon className="h-6 w-6 text-[var(--brand-green)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--brand-navy)]">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{d.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <CTASection
        title="Pronto para colocar a saúde ocupacional da sua empresa em dia?"
        description="Fale com um especialista ou solicite orçamento sem compromisso."
        primaryHref="/contato?tipo=orcamento"
        primaryLabel="Solicitar orçamento"
        secondaryHref="/encaminhamento-online"
        secondaryLabel="Encaminhamento online"
      />

      <section className="section-padding bg-white">
        <div className="container-page">
          <SectionTitle
            eyebrow="Preparo"
            title="Preparo de exames"
            description="Consulte o preparo e compartilhe com seus colaboradores."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card key={exam.id} className="premium-card-hover border-slate-200/80">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-[var(--brand-navy)]">{exam.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {exam.preparation}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/exames">
              <Button variant="outline" size="lg" className="rounded-xl">
                Ver todos os exames
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page">
          <SectionTitle eyebrow="Localização" title="Onde estamos" />
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-[var(--shadow-card)]">
            <iframe
              src={clinic.mapsEmbed}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização"
            />
          </div>
          <p className="mt-5 text-center text-slate-600">{clinic.address}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-page max-w-3xl">
          <SectionTitle eyebrow="FAQ" title="Perguntas frequentes" />
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group premium-card overflow-hidden border-slate-200/80 open:shadow-[var(--shadow-soft)]"
              >
                <summary className="cursor-pointer list-none px-6 py-5 font-semibold text-[var(--brand-navy)] transition hover:text-[var(--brand-green)] [&::-webkit-details-marker]:hidden">
                  {item.question}
                </summary>
                <p className="border-t border-slate-100 px-6 pb-5 pt-4 text-sm leading-relaxed text-slate-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
