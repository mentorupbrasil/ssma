import { ModulePlaceholder } from "@/components/dashboard/ModulePlaceholder";

export const metadata = { title: "Fechamento mensal" };

export default function FechamentoMensalPage() {
  return (
    <ModulePlaceholder
      title="Fechamento mensal"
      description="Feche atendimentos por empresa, importe planilhas do sistema clínico atual, aplique tabela de preços e controle notas e pagamentos."
      phase={3}
      features={[
        "Importação de CSV/XLSX do sistema clínico",
        "Cálculo automático com tabela de preços",
        "Relatório/PDF de fechamento",
        "Controle de nota fiscal e pagamento",
      ]}
    />
  );
}
