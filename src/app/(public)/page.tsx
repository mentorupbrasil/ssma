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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/public/SectionTitle";
import { CTASection } from "@/components/public/CTASection";
import { FAQ_ITEMS } from "@/data/services";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

const QUICK_CARDS = [
  { icon: FileCheck, title: "PCMSO", desc: "Programa completo de saúde ocupacional" },
  { icon: Stethoscope, title: "ASO", desc: "Atestados em conformidade com NR-7" },
  { icon: FlaskConical, title: "Exames", desc: "Laboratório próprio e resultados ágeis" },
  { icon: HardHat, title: "Segurança", desc: "PGR, LTCAT, laudos e treinamentos" },
];

const TRUST_STATS = [
  { value: "500+", label: "Empresas atendidas" },
  { value: "10k+", label: "Exames por ano" },
  { value: "98%", label: "Satisfação empresarial" },
];

const SOLUTIONS = [
  "Medicina ocupacional",
  "Segurança do trabalho",
  "Exames complementares",
  "Gestão de documentos ocupacionais",
  "Encaminhamento online",
  "Atendimento para empresas",
];

const STEPS = [
  "Empresa solicita orçamento",
  "Clínica cadastra a empresa",
  "Empresa encaminha colaboradores",
  "Colaborador realiza exames",
  "Clínica acompanha status e documentos",
];

const DIFFERENTIALS = [
  { icon: Clock, title: "Atendimento ágil", desc: "Fluxo organizado e prazos claros para o RH." },
  { icon: Users, title: "Equipe especializada", desc: "Médicos e técnicos com foco ocupacional." },
  { icon: Building2, title: "Estrutura climatizada", desc: "Ambiente confortável e acolhedor." },
  { icon: FlaskConical, title: "Laboratório próprio", desc: "Resultados mais rápidos e integrados." },
  { icon: Smartphone, title: "Gestão digital", desc: "Encaminhamentos e acompanhamento online." },
  { icon: Shield, title: "Apoio ao SOC", desc: "Integração quando necessário." },
];

export default async function HomePage() {
  const clinic = getClinicInfo();
  const exams = await prisma.exam.findMany({ where: { active: true }, take: 6 });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--brand-navy)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,160,133,0.22),transparent_55%)]" />
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-[var(--brand-green)]/10 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

        <div className="container-page relative py-16 md:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="animate-fade-up">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-100 backdrop-blur">
                <BadgeCheck className="h-4 w-4 text-[var(--brand-green)]" />
                Clínica ocupacional premium · Atendimento empresarial
              </p>
              <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                Medicina e Segurança do Trabalho com{" "}
                <span className="text-gradient-hero">agilidade, tecnologia e confiança</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Atendimento ocupacional completo para empresas de pequeno, médio e grande porte — com portal digital, encaminhamento online e gestão organizada.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/contato?tipo=orcamento">
                  <Button variant="brand" size="lg" className="w-full rounded-xl sm:w-auto">
                    Solicitar orçamento
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/encaminhamento-online">
                  <Button variant="outline-light" size="lg" className="w-full rounded-xl sm:w-auto">
                    Fazer encaminhamento
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[var(--brand-green)]" /> Dados protegidos (LGPD)
                </span>
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[var(--brand-green)]" /> Encaminhamento digital
                </span>
              </div>
            </div>

            <div className="animate-fade-up-delay">
              <div className="premium-card relative overflow-hidden border-white/10 bg-white/95 p-6 shadow-[var(--shadow-elevated)] md:p-8">
                <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-[var(--brand-green-light)] to-transparent" />
                <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-green)]">
                  Por que empresas confiam
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {TRUST_STATS.map((stat) => (
                    <div key={stat.label} className="text-center sm:text-left xl:text-center">
                      <p className="text-3xl font-bold text-[var(--brand-navy)]">{stat.value}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
                  {["Portal para empresas clientes", "Acompanhamento de status em tempo real", "Equipe dedicada ao RH"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--brand-green)]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_CARDS.map((card) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-[var(--brand-green)]/30 hover:bg-white/10"
              >
                <div className="mb-4 inline-flex rounded-xl bg-[var(--brand-green)]/15 p-2.5 transition group-hover:bg-[var(--brand-green)]/25">
                  <card.icon className="h-5 w-5 text-[var(--brand-green)]" />
                </div>
                <h3 className="font-semibold text-white">{card.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page">
          <SectionTitle
            eyebrow="Soluções"
            title="Soluções para sua empresa"
            description="Tudo que sua empresa precisa para cumprir obrigações legais e cuidar da saúde dos colaboradores."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s) => (
              <div
                key={s}
                className="premium-card-hover flex items-center gap-4 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-light)]">
                  <CheckCircle2 className="h-5 w-5 text-[var(--brand-green)]" />
                </div>
                <span className="font-semibold text-[var(--brand-navy)]">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-page">
          <SectionTitle eyebrow="Processo" title="Como funciona" />
          <div className="grid gap-8 md:grid-cols-5">
            {STEPS.map((step, i) => (
              <div key={step} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[calc(50%+1.5rem)] top-6 hidden h-px w-[calc(100%-3rem)] bg-slate-200 md:block" />
                )}
                <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-green-light)] text-lg font-bold text-[var(--brand-navy)] shadow-sm">
                  {i + 1}
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page">
          <SectionTitle
            eyebrow="Diferenciais"
            title={`Por que escolher a ${clinic.name}?`}
            description="Estrutura, tecnologia e equipe dedicada ao atendimento ocupacional."
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

      <CTASection
        title="Reduza atrasos, organize encaminhamentos e acompanhe seus exames ocupacionais em um só lugar."
        description="Solicite um orçamento ou faça seu encaminhamento online agora mesmo."
      />

      <section className="section-padding bg-white">
        <div className="container-page">
          <SectionTitle
            eyebrow="Preparo"
            title="Preparo de exames"
            description="Consulte rapidamente o preparo necessário para cada exame."
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
