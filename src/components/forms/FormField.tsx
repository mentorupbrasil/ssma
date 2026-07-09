"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function FormField({ label, error, hint, children, className, id: idProp }: FormFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;

  let field = children;
  if (isValidElement(children)) {
    field = cloneElement(children as ReactElement<{ id?: string }>, { id });
  }

  return (
    <div className={cn("form-field", className)}>
      <Label htmlFor={id} className="form-label">
        {label}
      </Label>
      {field}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
