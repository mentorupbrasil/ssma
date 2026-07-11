"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Mantém sidebar/topbar do dashboard; só troca o conteúdo da página. */
export default function DashboardError({
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
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Falha ao carregar esta tela</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          O menu lateral continua disponível. Tente novamente ou escolha outra seção.
        </p>
        <Button variant="brand" size="sm" className="mt-5 rounded-lg" onClick={() => reset()}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
