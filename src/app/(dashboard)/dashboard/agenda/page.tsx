import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";

/**
 * Agenda operacional foi descontinuada na visão da clínica.
 * A operação diária ocorre na Fila de atendimentos.
 */
export default async function AgendaPage() {
  const session = await requireAuthSession();
  if (isEmpresaUser(session)) {
    redirect("/dashboard/encaminhamentos");
  }
  redirect("/dashboard/encaminhamentos");
}
