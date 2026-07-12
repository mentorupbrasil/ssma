import { notFound } from "next/navigation";
import { normalizeRole } from "@/lib/tenant";
import { requireAuthSession } from "@/lib/page-auth";
import { loadAssinaturaDataAction } from "@/actions/subscription";
import { AssinaturaClient } from "@/components/dashboard/subscription/AssinaturaClient";
import { PageShell } from "@/components/dashboard/PageShell";

export const metadata = { title: "Assinatura" };

export default async function AssinaturaPage() {
  const session = await requireAuthSession();
  if (normalizeRole(session.user.role) !== "CLINIC_ADMIN") {
    notFound();
  }

  const data = await loadAssinaturaDataAction(1);
  if (!data.ok) {
    notFound();
  }

  return (
    <PageShell width="wide">
      <AssinaturaClient initial={data} />
    </PageShell>
  );
}
