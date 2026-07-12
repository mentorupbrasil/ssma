import { TabelaPrecosClient } from "@/components/dashboard/pricing/TabelaPrecosClient";
import { listPriceCatalog } from "@/actions/pricing";

export const metadata = { title: "Tabela de preços" };

export default async function TabelaPrecosPage() {
  const catalog = await listPriceCatalog();

  return <TabelaPrecosClient defaults={catalog.defaults} />;
}
