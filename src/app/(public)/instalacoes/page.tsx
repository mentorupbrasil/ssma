import { Building2, FlaskConical, Stethoscope, Snowflake, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/public/PageHero";
import { SectionTitle } from "@/components/public/SectionTitle";
import { CTASection } from "@/components/public/CTASection";
import { MediaPlaceholder } from "@/components/public/MediaPlaceholder";
import { siteMedia } from "@/config/media";

export const metadata = { title: "Instalações" };

const STRUCTURES = [
  { icon: Building2, title: "Recepção", desc: "Ambiente acolhedor com atendimento organizado." },
  { icon: Stethoscope, title: "Consultórios", desc: "Salas equipadas para avaliações clínicas." },
  { icon: FlaskConical, title: "Laboratório", desc: "Coleta e análises com agilidade." },
  { icon: Stethoscope, title: "Sala de exames", desc: "Audiometria, espirometria, ECG e mais." },
  { icon: Snowflake, title: "Ambiente climatizado", desc: "Conforto térmico em todas as áreas." },
  { icon: MapPin, title: "Localização estratégica", desc: "Fácil acesso e estacionamento próximo." },
];

export default function InstalacoesPage() {
  return (
    <>
      <PageHero
        eyebrow="Estrutura"
        title="Nossas instalações"
        description="Estrutura moderna, climatizada e preparada para o atendimento ocupacional."
      />

      <section className="section-padding">
        <div className="container-page">
          <SectionTitle
            title="Galeria"
            description="Anexe fotos reais em src/config/media.ts → gallery[].src"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {siteMedia.gallery.map((item) => (
              <MediaPlaceholder
                key={item.label}
                label={item.label}
                src={item.src || undefined}
                hint="/public/images/instalacoes/"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-page">
          <SectionTitle title="Estrutura" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STRUCTURES.map((s) => (
              <Card key={s.title} className="premium-card-hover border-slate-200/80">
                <CardContent className="pt-6">
                  <s.icon className="mb-4 h-8 w-8 text-[var(--brand-green)]" />
                  <h3 className="font-semibold text-[var(--brand-navy)]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
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
