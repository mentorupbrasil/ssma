import { ModulePlaceholder } from "@/components/dashboard/ModulePlaceholder";

export const metadata = { title: "Clínicas" };

export default function SuperAdminClinicasPage() {
  return (
    <ModulePlaceholder
      title="Clínicas"
      description="Gerencie clínicas clientes, planos, status de assinatura e uso do sistema."
      phase={6}
      features={[
        "Listagem de todas as clínicas",
        "Status: Ativa, Trial, Suspensa",
        "Planos e limites",
        "Métricas de uso por clínica",
      ]}
    />
  );
}
