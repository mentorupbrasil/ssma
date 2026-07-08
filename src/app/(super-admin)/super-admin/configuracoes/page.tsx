import { ModulePlaceholder } from "@/components/dashboard/ModulePlaceholder";

export const metadata = { title: "Configurações globais" };

export default function SuperAdminConfigPage() {
  return (
    <ModulePlaceholder
      title="Configurações globais"
      description="Parâmetros globais do SaaS, planos e integrações."
      phase={6}
      features={[
        "Planos e assinaturas",
        "Configurações de IA",
        "Logs técnicos",
      ]}
    />
  );
}
