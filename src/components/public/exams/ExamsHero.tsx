"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EXAMS_HERO_BADGES } from "@/data/exams-page";

export function ExamsHero() {
  const scrollToCatalog = () => {
    const section = document.getElementById("preparo-por-exame");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      document.getElementById("exam-search-input")?.focus();
    }, 400);
  };

  return (
    <section className="exams-hero scroll-mt-[var(--header-height)]">
      <div className="exams-hero-bg" aria-hidden />
      <div className="container-page exams-hero-inner">
        <p className="exams-hero-eyebrow">Exames ocupacionais</p>
        <h1 className="exams-hero-title">Exames e preparos ocupacionais</h1>
        <p className="exams-hero-desc">
          Consulte orientações de preparo, prazos e observações importantes para exames ocupacionais
          realizados conforme a solicitação da empresa, PCMSO ou avaliação médica.
        </p>

        <div className="exams-hero-badges" aria-label="Destaques da página">
          {EXAMS_HERO_BADGES.map((badge) => (
            <span key={badge} className="exams-hero-badge">
              {badge}
            </span>
          ))}
        </div>

        <div className="exams-hero-actions">
          <Button variant="brand" size="lg" className="rounded-xl" onClick={scrollToCatalog}>
            <Search className="mr-2 h-4 w-4" />
            Buscar exame
          </Button>
          <Link href="/encaminhamento-online">
            <Button variant="outline" size="lg" className="rounded-xl border-slate-200 bg-white/80">
              Fazer encaminhamento online
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
