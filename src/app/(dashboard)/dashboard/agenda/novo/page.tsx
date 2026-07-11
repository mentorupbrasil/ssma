import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";

/** Rota legada: a clínica não cria agendamentos nesta tela. */
export default async function NovoAgendamentoPage() {
  const session = await requireAuthSession();

  if (isEmpresaUser(session)) {
    redirect("/dashboard/encaminhamentos/novo");
  }

  redirect("/dashboard/agenda");
}
