import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <FileQuestion className="h-6 w-6 text-[var(--brand-navy)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--brand-navy)]">Página não encontrada</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          O endereço pode estar incorreto ou a página foi removida.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button variant="brand">Voltar ao início</Button>
          </Link>
          <Link href="/contato">
            <Button variant="outline">Falar conosco</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
