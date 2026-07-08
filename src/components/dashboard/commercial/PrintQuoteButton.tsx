"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintQuoteButton() {
  return (
    <Button variant="brand" onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
    </Button>
  );
}
