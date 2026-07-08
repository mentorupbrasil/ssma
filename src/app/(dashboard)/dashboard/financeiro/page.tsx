import { ModulePlaceholder } from "@/components/dashboard/ModulePlaceholder";

export const metadata = { title: "Financeiro" };

export default function FinanceiroPage() {
  return (
    <ModulePlaceholder
      title="Financeiro"
      description="Controle contas a receber, contas a pagar, despesas, receitas e vínculo com fechamentos mensais."
      phase={4}
      features={[
        "Contas a receber por empresa",
        "Despesas e categorias",
        "Dashboard de faturamento",
        "Vínculo com fechamentos e notas",
      ]}
    />
  );
}
