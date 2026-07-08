import { ModulePlaceholder } from "@/components/dashboard/ModulePlaceholder";

export const metadata = { title: "Tarefas e programação" };

export default function TarefasPage() {
  return (
    <ModulePlaceholder
      title="Tarefas e programação"
      description="Organize visitas técnicas, emissão de documentos, retornos comerciais e programação da equipe SST."
      phase={5}
      features={[
        "Lista, Kanban e calendário",
        "Vínculo com empresa, documento e chamado",
        "Prioridades e alertas de vencimento",
        "Checklist e comentários internos",
      ]}
    />
  );
}
