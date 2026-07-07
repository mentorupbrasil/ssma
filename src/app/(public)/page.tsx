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
  { icon: Clock, title: "Atendimento ágil", desc: "Fluxo organizado e prazos claros" },
  { icon: Users, title: "Equipe especializada", desc: "Médicos e técnicos experientes" },
  { icon: Building2, title: "Estrutura climatizada", desc: "Ambiente confortável e moderno" },
  { icon: FlaskConical, title: "Laboratório próprio", desc: "Resultados mais rápidos" },
  { icon: Smartphone, title: "Gestão digital", desc: "Encaminhamentos e acompanhamento online" },
  { icon: Shield, title: "Apoio ao SOC", desc: "Integração quando necessário" },
];

export default async function HomePage() {
  const clinic = getClinicInfo();
  const exams = await prisma.exam.findMany({ where: { active: true }, take: 6 });

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F3D4A] via-[#0F3D4A] to-[#1a5568] py-20 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <Shield className="h-4 w-4 text-[#16A085]" />
              Clínica ocupacional premium
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Medicina e Segurança do Trabalho com agilidade, tecnologia e confiança
            </h1>
            <p className="mt-6 text-lg text-slate-300 sm:text-xl">
              Atendimento ocupacional completo para empresas de pequeno, médio e grande porte.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/contato?tipo=orcamento">
                <Button size="lg" className="w-full bg-[#16A085] hover:bg-[#138d75] sm:w-auto">
                  Solicitar orçamento
                </Button>
              </Link>
              <Link href="/encaminhamento-online">
                <Button size="lg" variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto">
                  Fazer encaminhamento
                </Button>
              </Link>
              <a href={whatsappLink("Olá! Gostaria de mais informações.")} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto">
                  Falar no WhatsApp
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_CARDS.map((card) => (
              <div key={card.title} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <card.icon className="mb-3 h-8 w-8 text-[#16A085]" />
                <h3 className="font-semibold">{card.title}</h3>
                <p className="mt-1 text-sm text-slate-300">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Soluções"
            title="Soluções para sua empresa"
            description="Tudo que sua empresa precisa para cumprir obrigações legais e cuidar da saúde dos colaboradores."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s) => (
              <div key={s} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#16A085]" />
                <span className="font-medium text-[#0F3D4A]">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle eyebrow="Processo" title="Como funciona" />
          <div className="grid gap-6 md:grid-cols-5">
            {STEPS.map((step, i) => (
              <div key={step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#DFF7F0] text-lg font-bold text-[#0F3D4A]">
                  {i + 1}
                </div>
                <p className="text-sm font-medium text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle eyebrow="Diferenciais" title={`Por que escolher a ${clinic.name}?`} description="Estrutura, tecnologia e equipe dedicada ao atendimento ocupacional." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DIFFERENTIALS.map((d) => (
              <Card key={d.title} className="border-slate-200 shadow-sm">
                <CardContent className="pt-6">
                  <d.icon className="mb-4 h-8 w-8 text-[#16A085]" />
                  <h3 className="font-semibold text-[#0F3D4A]">{d.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{d.desc}</p>
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

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle eyebrow="Preparo" title="Preparo de exames" description="Consulte rapidamente o preparo necessário para cada exame." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card key={exam.id} className="border-slate-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-[#0F3D4A]">{exam.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{exam.preparation}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/exames">
              <Button variant="outline">Ver todos os exames <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle eyebrow="Localização" title="Onde estamos" />
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
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
          <p className="mt-4 text-center text-slate-600">{clinic.address}</p>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionTitle eyebrow="FAQ" title="Perguntas frequentes" />
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group rounded-xl border border-slate-200 bg-slate-50 p-5">
                <summary className="cursor-pointer font-medium text-[#0F3D4A]">{item.question}</summary>
                <p className="mt-3 text-sm text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
