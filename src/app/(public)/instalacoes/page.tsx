import { Building2, FlaskConical, Stethoscope, Snowflake, MapPin } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { SectionTitle } from "@/components/public/SectionTitle";
import { CTASection } from "@/components/public/CTASection";
import { LocationSection } from "@/components/public/LocationSection";
import { PageSection } from "@/components/public/PageSection";
import { FeatureCard } from "@/components/public/FeatureCard";
import { MediaPlaceholder } from "@/components/public/MediaPlaceholder";
import { siteMedia } from "@/config/media";

export const metadata = { title: "Instalações" };

const STRUCTURES = [
  { icon: Building2, title: "Recepção", desc: "Ambiente acolhedor com atendimento organizado." },
  { icon: Stethoscope, title: "Consultórios", desc: "Salas equipadas para avaliações clínicas." },
  { icon: FlaskConical, title: "Laboratório", desc: "Coleta e análises com agilidade." },
  { icon: Stethoscope, title: "Sala de exames", desc: "Audiometria, espirometria, ECG e mais." },
  { icon: Snowflake, title: "Ambiente climatizado", desc: "Conforto térmico em todas as áreas." },
  { icon: MapPin, title: "Localização estratégica", desc: "Fácil acesso para colaboradores e empresas." },
];

export default function InstalacoesPage() {
  return (
    <>
      <PageHero
        eyebrow="Estrutura"
        title="Nossas instalações"
        description="Estrutura moderna, climatizada e preparada para o atendimento ocupacional."
      />

      <PageSection>
        <SectionTitle
          title="Ambientes de atendimento"
          description="Espaços pensados para receber colaboradores e empresas com conforto e organização."
          className="!mb-8 md:!mb-9"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {siteMedia.gallery.map((item) => (
            <MediaPlaceholder key={item.label} label={item.label} src={item.src || undefined} />
          ))}
        </div>
      </PageSection>

      <PageSection variant="white">
        <SectionTitle title="Estrutura completa" className="!mb-8 md:!mb-9" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STRUCTURES.map((s) => (
            <FeatureCard key={s.title} icon={s.icon} title={s.title} description={s.desc} />
          ))}
        </div>
      </PageSection>

      <LocationSection />

      <CTASection
        title="Conheça nossa estrutura pessoalmente"
        description="Agende uma visita ou fale com nossa equipe."
        primaryLabel="Solicitar orçamento sem compromisso"
        primaryHref="/contato?tipo=orcamento"
      />
    </>
  );
}
