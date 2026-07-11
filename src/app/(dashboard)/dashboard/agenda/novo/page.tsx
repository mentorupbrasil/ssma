import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";

export default async function NovoAgendamentoPage() {
  const session = await requireAuthSession();

  if (isEmpresaUser(session)) {
    redirect("/dashboard/encaminhamentos/novo");
  }

  redirect("/dashboard/agenda?new=1");
}
