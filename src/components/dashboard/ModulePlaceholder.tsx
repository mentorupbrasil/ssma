import { Construction } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-green-light)]">
          <Construction className="h-7 w-7 text-[var(--brand-green)]" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-slate-900">Módulo em desenvolvimento</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">{description}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--brand-green)]">
          Fase {phase} do roadmap
        </p>
        {features.length > 0 && (
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-slate-600">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-green)]" />
                {f}
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard" className="mt-8 inline-block">
          <Button variant="outline">Voltar à visão geral</Button>
        </Link>
      </div>
    </div>
  );
}
