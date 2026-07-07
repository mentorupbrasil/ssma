import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({ label, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("form-field", className)}>
      <Label className="form-label">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
