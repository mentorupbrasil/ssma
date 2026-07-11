"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type BlogCopyLinkProps = {
  url: string;
};

export function BlogCopyLink({ url }: BlogCopyLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="blog-copy-link rounded-xl"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="size-4" aria-hidden />
          Link copiado
        </>
      ) : (
        <>
          <Link2 className="size-4" aria-hidden />
          Copiar link
        </>
      )}
    </Button>
  );
}
