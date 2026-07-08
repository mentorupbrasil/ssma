import { redirect } from "next/navigation";

export default function NovoColaboradorPage() {
  redirect("/dashboard/colaboradores?new=1");
}
