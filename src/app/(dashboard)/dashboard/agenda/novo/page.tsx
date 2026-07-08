import { redirect } from "next/navigation";

export default function NovoAgendamentoPage() {
  redirect("/dashboard/agenda?new=1");
}
