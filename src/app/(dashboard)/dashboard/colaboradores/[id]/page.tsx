import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCollaboratorDetail } from "@/actions/collaborators";
import { ColaboradorDetailClient } from "@/components/dashboard/collaborators/ColaboradorDetailClient";
import { canManageCollaborators } from "@/lib/collaborators";
import { isEmpresaUser } from "@/lib/authz";
import { requireAuthSession } from "@/lib/page-auth";
import { Loader2 } from "lucide-react";

async function DetailData({ id }: { id: string }) {
  const session = await requireAuthSession();
  const result = await getCollaboratorDetail(id);
  if (!result.success) notFound();

  return (
    <ColaboradorDetailClient
      collaborator={result.collaborator}
      canManage={canManageCollaborators(session.user.role) || session.user.role === "RECEPCAO"}
      isEmpresaPortal={isEmpresaUser(session)}
    />
  );
}

export default async function ColaboradorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
        </div>
      }
    >
      <DetailData id={id} />
    </Suspense>
  );
}
