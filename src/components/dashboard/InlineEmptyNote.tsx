import { cn } from "@/lib/utils";

type InlineEmptyNoteProps = {
  children: React.ReactNode;
  className?: string;
};

export function InlineEmptyNote({ children, className }: InlineEmptyNoteProps) {
  return (
    <p
      className={cn(
        "rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-center text-sm text-slate-500",
        className
      )}
    >
      {children}
    </p>
  );
}
