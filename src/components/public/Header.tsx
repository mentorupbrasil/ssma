"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getClinicInfo } from "@/lib/helpers";

const NAV_ITEMS = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/exames", label: "Exames" },
  { href: "/empresas", label: "Empresas" },
  { href: "/encaminhamento-online", label: "Encaminhamento Online" },
  { href: "/instalacoes", label: "Instalações" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const clinic = getClinicInfo();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F3D4A] text-sm font-bold text-white">
            U
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-[#0F3D4A]">{clinic.name}</p>
            <p className="hidden text-xs text-slate-500 sm:block">Medicina do Trabalho</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-[#0F3D4A]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/contato?tipo=orcamento">
            <Button size="sm" className="bg-[#16A085] hover:bg-[#138d75]">
              Solicitar orçamento
            </Button>
          </Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="lg:hidden"
            render={
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            }
          />
          <SheetContent side="right" className="w-80">
            <div className="mt-8 flex flex-col gap-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-slate-700"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">Entrar</Button>
              </Link>
              <Link href="/contato?tipo=orcamento" onClick={() => setOpen(false)}>
                <Button className="w-full bg-[#16A085] hover:bg-[#138d75]">
                  Solicitar orçamento
                </Button>
              </Link>
              <a href={`tel:${clinic.phone}`} className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4" />
                {clinic.phone}
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
