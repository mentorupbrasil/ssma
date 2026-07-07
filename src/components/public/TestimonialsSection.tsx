import {
  Briefcase,
  Building2,
  ClipboardList,
  Factory,
  FileCheck,
  HardHat,
  HeartPulse,
  Stethoscope,
  Users,
  Wrench,
} from "lucide-react";
import { SectionTitle } from "@/components/public/SectionTitle";

const RESULT_BENEFITS = [
  {
    title: "Menos retrabalho para o RH",
    desc: "Encaminhamentos online e acompanhamento de status reduzem ligações, planilhas e controles manuais.",
    icon: ClipboardList,
  },
  {
    title: "Exames com fluxo mais organizado",
    desc: "Admissional, periódico, demissional, retorno ao trabalho e mudança de função em um processo mais claro.",
    icon: Stethoscope,
  },
  {
    title: "Documentos ocupacionais em dia",
    desc: "PCMSO, ASO, PGR, LTCAT, PPP e eSocial SST com mais controle e previsibilidade.",
    icon: FileCheck,
  },
] as const;

const BUSINESS_SEGMENTS = [
  { label: "Indústrias", icon: Factory },
  { label: "Comércio", icon: Building2 },
  { label: "Construção civil", icon: HardHat },
  { label: "Clínicas", icon: HeartPulse },
  { label: "Escritórios", icon: Briefcase },
  { label: "Prestadores de serviço", icon: Wrench },
  { label: "Empresas terceirizadas", icon: Users },
] as const;

export function TestimonialsSection() {
  return (
    <section className="results-section scroll-mt-[var(--header-height)] bg-white">
      <div className="container-page">
        <SectionTitle
          eyebrow="Resultados para empresas"
          title="Mais organização para o RH e mais segurança para sua empresa"
          description="Centralize encaminhamentos, acompanhe exames e mantenha documentos ocupacionais em dia com um fluxo mais claro e digital."
          className="results-section-title"
        />

        <div className="results-benefits-grid">
          {RESULT_BENEFITS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="results-benefit-card group">
                <div className="results-benefit-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <h3 className="results-benefit-title">{item.title}</h3>
                <p className="results-benefit-desc">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="results-segments">
          <h3 className="results-segments-heading">Atendimento para diferentes segmentos</h3>
          <div className="results-segments-grid">
            {BUSINESS_SEGMENTS.map((segment) => {
              const Icon = segment.icon;
              return (
                <span key={segment.label} className="results-segment-chip">
                  <Icon className="results-segment-icon" strokeWidth={1.75} />
                  {segment.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
