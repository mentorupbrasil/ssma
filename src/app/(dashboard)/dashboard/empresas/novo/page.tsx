import { redirect } from "next/navigation";

export default function NovaEmpresaPage() {
  redirect("/dashboard/empresas?new=1");
}
