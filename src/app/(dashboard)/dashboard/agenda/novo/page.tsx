import { redirect } from "next/navigation";

/** Rota legada: a clínica não cria agendamentos. */
export default function NovoAgendamentoPage() {
  redirect("/dashboard/encaminhamentos");
}
