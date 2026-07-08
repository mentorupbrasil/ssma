import { ModulePlaceholder } from "@/components/dashboard/ModulePlaceholder";

export const metadata = { title: "Assistente SST" };

export default function AssistenteSstPage() {
  return (
    <ModulePlaceholder
      title="Assistente SST"
      description="Apoio com IA para rascunhos de PGR, LTCAT, ordens de serviço, checklists e relatórios técnicos. Sempre revisado por profissional habilitado."
      phase={7}
      features={[
        "Rascunhos de PGR, LTCAT e APR",
        "Templates e prompts estruturados",
        "Histórico de versões",
        "Aviso: documento de apoio, não substitui emissão técnica",
      ]}
    />
  );
}
