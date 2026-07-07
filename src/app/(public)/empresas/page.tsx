import Link from "next/link";
import { CheckCircle2, Building2, Users, FileText, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/public/SectionTitle";
import { CTASection } from "@/components/public/CTASection";

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
  { title: "Pequenas empresas", desc: "Soluções acessíveis com atendimento personalizado e portal simplificado." },
  { title: "Médias empresas", desc: "Gestão de múltiplos colaboradores com relatórios e acompanhamento de status." },
  { title: "Grandes empresas", desc: "Volume alto, integração com SOC e suporte dedicado para RH." },
];

export default function EmpresasPage() {
  return (
    <>
      <section className="bg-[#0F3D4A] py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold sm:text-5xl">Sua empresa mais segura, regularizada e organizada</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Portal exclusivo para empresas clientes com encaminhamento online, acompanhamento de exames e gestão documental.
          </p>
          <Link href="/contato?tipo=orcamento" className="mt-8 inline-block">
            <Button size="lg" className="bg-[#16A085] hover:bg-[#138d75]">Solicitar orçamento</Button>
          </Link>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle title="Benefícios para sua empresa" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.text} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <b.icon className="h-6 w-6 shrink-0 text-[#16A085]" />
                <span className="font-medium text-[#0F3D4A]">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle title="Atendimento por porte" />
          <div className="grid gap-6 md:grid-cols-3">
            {SIZES.map((s) => (
              <Card key={s.title} className="border-slate-200">
                <CardContent className="pt-6">
                  <Building2 className="mb-4 h-8 w-8 text-[#16A085]" />
                  <h3 className="text-lg font-semibold text-[#0F3D4A]">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Portal da empresa"
            description="Após cadastro, sua empresa acessa o painel com login exclusivo."
          />
          <div className="rounded-2xl border border-slate-200 bg-[#DFF7F0]/50 p-8">
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#16A085]" /> Cadastrar colaboradores</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#16A085]" /> Emitir encaminhamentos</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#16A085]" /> Acompanhar status dos exames</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#16A085]" /> Consultar preparo de exames</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#16A085]" /> Solicitar documentos</li>
            </ul>
            <Link href="/login" className="mt-6 inline-block">
              <Button className="bg-[#0F3D4A] hover:bg-[#0a2a33]">Acessar portal</Button>
            </Link>
          </div>
        </div>
      </section>

      <CTASection title="Pronto para organizar a saúde ocupacional da sua empresa?" description="Fale com nossa equipe comercial." />
    </>
  );
}
