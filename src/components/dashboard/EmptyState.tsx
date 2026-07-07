import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 px-6 text-center">
      <div className="mb-4 rounded-full bg-slate-100 p-4">
        <FileQuestion className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6 bg-[#16A085] hover:bg-[#138d75]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
