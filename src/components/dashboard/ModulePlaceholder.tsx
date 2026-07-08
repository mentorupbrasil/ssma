import { Construction } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  phase: number;
  features?: string[];
};

export function ModulePlaceholder({
  title,
  description,
  phase,
  features = [],
}: ModulePlaceholderProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        className="bg-white"
        title="Módulo em desenvolvimento"
        description={`${description} (Fase ${phase} do roadmap)`}
        action={{
          label: "Voltar à visão geral",
          href: "/dashboard",
          variant: "outline",
        }}
      />
      {features.length > 0 && (
        <ul className="mx-auto mt-6 max-w-md space-y-2 rounded-xl border border-slate-200 bg-white p-6 text-left text-sm text-slate-600 shadow-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-green)]" />
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
