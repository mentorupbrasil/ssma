import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  FlaskConical,
  Shield,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { SectionTitle } from "@/components/public/SectionTitle";
import { ServiceCard } from "@/components/public/ServiceCard";
import { ServicesQuickNav } from "@/components/public/ServicesQuickNav";
import { CTASection } from "@/components/public/CTASection";
import { PageSection } from "@/components/public/PageSection";
import { Button } from "@/components/ui/button";
import { SERVICE_CATEGORIES } from "@/data/services";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { cn } from "@/lib/utils";

export const metadata = { title: "Serviços" };

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "medicina-ocupacional": Stethoscope,
  "seguranca-trabalho": Shield,
  "exames-complementares": FlaskConical,
  documentacao: ClipboardList,
};

const QUICK_NAV_ITEMS = [
  { id: "medicina-ocupacional", label: "Medicina Ocupacional" },
  { id: "seguranca-trabalho", label: "Segurança do Trabalho" },
  { id: "exames-complementares", label: "Exames Complementares" },
  { id: "documentacao", label: "Documentação" },
];

export default function ServicosPage() {
  const clinic = getClinicInfo();

  return (
    <>
      <PageHero
        eyebrow="Portfólio completo"
        title="Soluções em Saúde e Segurança do Trabalho"
        description="PCMSO, ASO, laudos, exames e documentação ocupacional para empresas que precisam de conformidade, agilidade e organização."
        layout="stack"
        className="services-page-hero"
      >
        <Link href="/contato?tipo=orcamento">
          <Button variant="brand" className="rounded-xl">
            Solicitar orçamento
          </Button>
        </Link>
        <a
          href={whatsappLink(
            `Olá! Gostaria de falar com um especialista da ${clinic.name} sobre serviços de SST.`
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            className="rounded-xl border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Falar com especialista
          </Button>
        </a>
      </PageHero>

      <ServicesQuickNav items={QUICK_NAV_ITEMS} />

      {SERVICE_CATEGORIES.map((category, index) => {
        const CategoryIcon = CATEGORY_ICONS[category.id] ?? BookOpen;

        return (
          <PageSection
            key={category.id}
            id={category.id}
            variant={index % 2 === 0 ? "white" : "default"}
            className={cn(
              "services-section services-section--anchor",
              category.id === "seguranca-trabalho" && "services-section--safety",
              category.id === "exames-complementares" && "services-section--exams",
              category.id === "documentacao" && "services-section--docs"
            )}
          >
            <SectionTitle
              eyebrow="Serviços"
              title={category.title}
              description={category.description}
              align="left"
              className="services-section-title"
            />
            <div className="services-grid">
              {category.services.map((service) => (
                <ServiceCard
                  key={service.name}
                  {...service}
                  icon={CategoryIcon}
                  ctaVariant={category.cardVariant ?? "clinical"}
                />
              ))}
            </div>
          </PageSection>
        );
      })}

      <CTASection
        className="services-final-cta"
        title="Precisa regularizar exames, laudos ou documentos ocupacionais?"
        description="Nossa equipe monta uma proposta personalizada conforme o porte da sua empresa, riscos ocupacionais e serviços necessários."
        primaryLabel="Solicitar orçamento sem compromisso"
        secondaryHref={whatsappLink(
          `Olá! Gostaria de falar com um especialista da ${clinic.name} sobre serviços de SST.`
        )}
        secondaryLabel="Falar com especialista"
      />
    </>
  );
}
