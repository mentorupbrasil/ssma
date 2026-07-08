import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { UiScale } from "@/components/ui/ui-scale";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UiScale />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
