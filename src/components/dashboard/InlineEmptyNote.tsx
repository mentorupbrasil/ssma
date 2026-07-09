import { cn } from "@/lib/utils";

type InlineEmptyNoteProps = {
  children: React.ReactNode;
  className?: string;
};

export function InlineEmptyNote({ children, className }: InlineEmptyNoteProps) {
  return (
    <p className={cn("inline-empty-note", className)}>
      {children}
    </p>
  );
}
