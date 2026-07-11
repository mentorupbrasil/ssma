"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Boundary de rota: renderiza DENTRO do layout (sem html/body). */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-[var(--brand-navy)]">Algo deu errado</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="brand" onClick={() => reset()}>
            Tentar novamente
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">
              Ir para o painel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
