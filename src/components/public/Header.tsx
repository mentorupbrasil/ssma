"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Phone, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/servicos", label: "Serviços" },
  { href: "/exames", label: "Exames" },
  { href: "/empresas", label: "Empresas" },
  { href: "/encaminhamento-online", label: "Encaminhamento" },
  { href: "/instalacoes", label: "Instalações" },
  { href: "/contato", label: "Contato" },
];

const SPECIALIST_MSG = "Olá! Gostaria de falar com um especialista em SST.";

export function Header() {
  const [open, setOpen] = useState(false);
  const clinic = getClinicInfo();

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="container-page flex h-[4.25rem] items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-navy)] text-sm font-bold text-white shadow-sm transition group-hover:shadow-md">
            U
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-[var(--brand-navy)]">{clinic.name}</p>
            <p className="hidden text-[0.7rem] font-medium uppercase tracking-wider text-slate-500 sm:block">
              Medicina do Trabalho
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[var(--brand-navy)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-slate-600">
              Entrar
            </Button>
          </Link>
          <a href={whatsappLink(SPECIALIST_MSG)} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="rounded-lg border-[var(--brand-green)]/30 text-[var(--brand-navy)]">
              <MessageCircle className="mr-1.5 h-4 w-4 text-[var(--brand-green)]" />
              Especialista
            </Button>
          </a>
          <Link href="/contato?tipo=orcamento">
            <Button variant="brand" size="sm">
              Solicitar orçamento
            </Button>
          </Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="lg:hidden"
            render={
              <Button variant="outline" size="icon" className="rounded-xl">
                <Menu className="h-5 w-5" />
              </Button>
            }
          />
          <SheetContent side="right" className="w-[min(100vw-2rem,22rem)] border-slate-200 p-0">
            <div className="border-b border-slate-100 p-6">
              <p className="font-bold text-[var(--brand-navy)]">{clinic.name}</p>
              <p className="text-sm text-slate-500">Portal e atendimento empresarial</p>
            </div>
            <div className="flex flex-col gap-1 p-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {item.label}
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
            <div className="mt-auto space-y-3 border-t border-slate-100 p-4">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full rounded-xl">
                  Entrar
                </Button>
              </Link>
              <Link href="/contato?tipo=orcamento" onClick={() => setOpen(false)}>
                <Button variant="brand" className="w-full rounded-xl">
                  Solicitar orçamento
                </Button>
              </Link>
              <a
                href={whatsappLink(SPECIALIST_MSG)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <Button variant="outline" className="mt-2 w-full rounded-xl">
                  <MessageCircle className="mr-2 h-4 w-4 text-[var(--brand-green)]" />
                  Falar com especialista
                </Button>
              </a>
              <a
                href={`tel:${clinic.phone}`}
                className="flex items-center justify-center gap-2 py-2 text-sm text-slate-600"
              >
                <Phone className="h-4 w-4 text-[var(--brand-green)]" />
                {clinic.phone}
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
