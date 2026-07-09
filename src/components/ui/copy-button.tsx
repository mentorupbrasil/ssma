"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CopyButtonProps = Omit<React.ComponentProps<typeof Button>, "onClick" | "children" | "variant"> & {
  label?: string;
  text?: string;
  onCopy?: () => void | Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  showIcon?: boolean;
};

export function CopyButton({
  label = "Copiar",
  text,
  onCopy,
  successMessage = "Copiado com sucesso.",
  errorMessage = "Não foi possível copiar.",
  showIcon = true,
  className,
  size = "sm",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleClick = async () => {
    try {
      if (onCopy) {
        await onCopy();
      } else if (text !== undefined) {
        await navigator.clipboard.writeText(text);
      } else {
        return;
      }

      setCopied(true);
      toast.success(successMessage);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(errorMessage);
    }
  };

  return (
    <Button
      type="button"
      variant="copy"
      size={size}
      className={cn(className)}
      onClick={handleClick}
      {...props}
    >
      {showIcon &&
        (copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />)}
      {label}
    </Button>
  );
}
