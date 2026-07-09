"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/public/SocialIcons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { getClinicSiteConfig } from "@/config/clinic";
import { formatPhone, getClinicInfo, whatsappLink } from "@/lib/helpers";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/servicos", label: "Serviços" },
  { href: "/exames", label: "Exames" },
  { href: "/empresas", label: "Empresas" },
  { href: "/encaminhamento-online", label: "Encaminhamento online" },
  { href: "/contato", label: "Contato" },
] as const;

const LEGAL_LINKS = [
  { href: "/politica-de-privacidade", label: "Política de privacidade" },
  { href: "/termos-de-uso", label: "Termos de uso" },
  { href: "/atualizacoes", label: "Atualizações" },
] as const;

export function Footer() {
  const clinic = getClinicInfo();
  const config = getClinicSiteConfig();
  const [email, setEmail] = React.useState("");

  const socialLinks = [
    { icon: InstagramIcon, label: "Instagram", href: config.instagram },
    { icon: FacebookIcon, label: "Facebook", href: config.facebook },
  ].filter((item) => Boolean(item.href));

  const handleNewsletter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    const subject = encodeURIComponent(`Newsletter — ${clinic.name}`);
    const body = encodeURIComponent(
      `Olá! Gostaria de receber novidades e conteúdos da ${clinic.name} no e-mail: ${trimmed}`
    );
    window.location.href = `mailto:${clinic.email}?subject=${subject}&body=${body}`;
  };

  return (
    <footer className="relative mt-auto border-t border-slate-200/80 bg-background text-foreground transition-colors duration-300">
      <div className="container-page px-4 py-12 md:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter + marca */}
          <div className="relative">
            <div className="mb-5">
              <BrandLogo height={36} showLink href="/" />
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-[var(--brand-navy)] sm:text-3xl">
              Fique por dentro
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Receba novidades sobre saúde ocupacional, exames e orientações para sua empresa.
            </p>
            <form className="relative max-w-sm" onSubmit={handleNewsletter}>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                className="h-11 border-slate-200/80 bg-white/80 pr-12 backdrop-blur-sm"
              />
              <Button
                type="submit"
                size="icon"
                variant="brand"
                className="absolute right-1 top-1 h-9 w-9 rounded-full transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Inscrever-se na newsletter</span>
              </Button>
            </form>
            <div
              className="pointer-events-none absolute -right-2 top-8 h-24 w-24 rounded-full bg-[var(--brand-green)]/10 blur-2xl"
              aria-hidden
            />
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-[var(--brand-navy)]">Links rápidos</h3>
            <nav className="space-y-2.5 text-sm" aria-label="Links do site">
              {QUICK_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block text-muted-foreground transition-colors hover:text-[var(--brand-green)]"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contato */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-[var(--brand-navy)]">Contato</h3>
            <address className="space-y-3 text-sm not-italic text-muted-foreground">
              {config.hasAddress && (
                <p className="flex gap-2.5 leading-relaxed">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-green)]" strokeWidth={1.75} />
                  <span>{config.fullAddress}</span>
                </p>
              )}
              {config.hasWhatsApp && (
                <p className="flex gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-green)]" strokeWidth={1.75} />
                  <a
                    href={whatsappLink(`Olá! Gostaria de falar com a ${clinic.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[var(--brand-green)]"
                  >
                    WhatsApp: {formatPhone(config.whatsapp)}
                  </a>
                </p>
              )}
              {clinic.email && (
                <p className="flex gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-green)]" strokeWidth={1.75} />
                  <a
                    href={`mailto:${clinic.email}`}
                    className="break-all transition-colors hover:text-[var(--brand-green)]"
                  >
                    {clinic.email}
                  </a>
                </p>
              )}
            </address>
          </div>

          {/* Redes sociais */}
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold text-[var(--brand-navy)]">Siga a Unimetra</h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Acompanhe conteúdos sobre SST, exames ocupacionais e cuidados com sua equipe.
            </p>
            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-3" aria-label="Redes sociais">
                {socialLinks.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} da ${clinic.name}`}
                    title={`Siga no ${label}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "h-10 w-10 rounded-full border-slate-200/80 bg-white/60 shadow-sm transition-colors hover:border-[var(--brand-green)]/30 hover:text-[var(--brand-green)]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Em breve.</p>
            )}
            <div
              className="pointer-events-none absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-[var(--brand-navy)]/5 blur-2xl"
              aria-hidden
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 text-center md:flex-row md:text-left">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {clinic.name}. Todos os direitos reservados.
          </p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm md:justify-end" aria-label="Legal">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-muted-foreground transition-colors hover:text-[var(--brand-green)]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
