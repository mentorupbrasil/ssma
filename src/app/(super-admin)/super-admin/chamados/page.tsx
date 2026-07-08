import { ModulePlaceholder } from "@/components/dashboard/ModulePlaceholder";

export const metadata = { title: "Chamados das clínicas" };

export default function SuperAdminChamadosPage() {
  return (
    <ModulePlaceholder
      title="Chamados das clínicas"
      description="Suporte das clínicas para o dono do sistema — bugs, dúvidas, melhorias e configurações."
      phase={6}
      features={[
        "Chamados abertos por clínica",
        "Prioridade e responsável",
        "Histórico de mensagens",
        "Status de resolução",
      ]}
    />
  );
}
