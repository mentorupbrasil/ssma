import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageModule } from "@/components/dashboard/PageModule";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { requireAuthSession, handleAccessError } from "@/lib/page-auth";
import { assertReferralAccess } from "@/lib/authz";
import { serializeReferralDetail } from "@/lib/referrals";
import { ReferralDetailPageClient } from "@/components/dashboard/referrals/ReferralDetailPageClient";

export default async function EncaminhamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuthSession();

  try {
    await assertReferralAccess(session, id);
  } catch (error) {
    handleAccessError(error);
  }

  const referral = await prisma.referral.findUnique({
    where: { id },
    include: {
      company: true,
      patient: true,
      assignedTo: true,
      exams: true,
      appointments: { orderBy: { scheduledAt: "desc" } },
      referralDocuments: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
      documents: true,
      statusHistory: {
        include: { changedBy: true },
        orderBy: { createdAt: "desc" },
      },
      preReferral: true,
    },
  });

  if (!referral) notFound();

  const canManage =
    session.user.role !== "EMPRESA" && session.user.role !== "VISUALIZADOR";

  const serialized = serializeReferralDetail(referral);

  return (
    <PageModule>
      <PageHeader
        title={referral.protocol}
        description={`Colaborador: ${referral.patient.fullName} · Criado em ${format(referral.createdAt, "dd/MM/yyyy 'às' HH:mm")}`}
      >
        <StatusBadge status={referral.status} />
      </PageHeader>

      <div className="dashboard-surface p-4 sm:p-6">
        <ReferralDetailPageClient
          referral={serialized}
          canManage={canManage}
        />
      </div>
    </PageModule>
  );
}
