import { Building2, FlaskConical, Stethoscope, Snowflake, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/public/SectionTitle";
import { CTASection } from "@/components/public/CTASection";

export const metadata = { title: "Instalações" };

const STRUCTURES = [
  { icon: Building2, title: "Recepção", desc: "Ambiente acolhedor com atendimento organizado." },
  { icon: Stethoscope, title: "Consultórios", desc: "Salas equipadas para avaliações clínicas." },
  { icon: FlaskConical, title: "Laboratório", desc: "Coleta e análises com agilidade." },
  { icon: Stethoscope, title: "Sala de exames", desc: "Audiometria, espirometria, ECG e mais." },
  { icon: Snowflake, title: "Ambiente climatizado", desc: "Conforto térmico em todas as áreas." },
  { icon: MapPin, title: "Localização estratégica", desc: "Fácil acesso e estacionamento próximo." },
];

const GALLERY = [
  { color: "from-[#0F3D4A] to-[#1a5568]", label: "Recepção" },
  { color: "from-[#16A085] to-[#138d75]", label: "Consultório" },
  { color: "from-slate-600 to-slate-800", label: "Laboratório" },
  { color: "from-[#0F3D4A] to-[#16A085]", label: "Sala de exames" },
];

export default function InstalacoesPage() {
  return (
    <>
      <section className="bg-[#0F3D4A] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">Nossas instalações</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Estrutura moderna, climatizada e preparada para o atendimento ocupacional.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle title="Galeria" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GALLERY.map((item) => (
              <div
                key={item.label}
                className={`flex aspect-[4/3] items-end rounded-2xl bg-gradient-to-br ${item.color} p-6`}
              >
                <span className="text-lg font-semibold text-white">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle title="Estrutura" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STRUCTURES.map((s) => (
              <Card key={s.title} className="border-slate-200">
                <CardContent className="pt-6">
                  <s.icon className="mb-4 h-8 w-8 text-[#16A085]" />
                  <h3 className="font-semibold text-[#0F3D4A]">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Conheça nossa estrutura pessoalmente"
        description="Agende uma visita ou fale com nossa equipe."
        primaryLabel="Agendar visita"
        primaryHref="/contato"
      />
    </>
  );
}
