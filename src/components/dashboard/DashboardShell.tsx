import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[var(--brand-bg)]">
      <Sidebar user={session.user} />
      <div className="flex flex-1 flex-col lg:pl-0">
        <Topbar userName={session.user.name} />
        <main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
