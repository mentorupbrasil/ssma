import { ModulePlaceholder } from "@/components/dashboard/ModulePlaceholder";

export const metadata = { title: "Chamados" };

export default function ChamadosPage() {
  return (
    <ModulePlaceholder
      title="Chamados"
      description="Centralize solicitações das empresas/RH e suporte interno, com histórico e responsáveis."
      phase={5}
      features={[
        "Chamados da empresa para a clínica",
        "Segunda via de ASO e suporte ao portal",
        "Prioridade e status de atendimento",
        "Comentários e anexos",
      ]}
    />
  );
}
