"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  FileText,
  HelpCircle,
  MapPin,
  MessageCircle,
  Rocket,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQ_CATEGORIES } from "@/data/faq";
import { getClinicSiteConfig } from "@/config/clinic";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  inicio: Rocket,
  exames: Stethoscope,
  documentos: FileText,
  orcamento: Building2,
};

export function FAQSection() {
  const clinic = getClinicInfo();
  const config = getClinicSiteConfig();
  const [activeCategoryId, setActiveCategoryId] = useState(FAQ_CATEGORIES[0].id);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const activeCategory =
    FAQ_CATEGORIES.find((c) => c.id === activeCategoryId) ?? FAQ_CATEGORIES[0];

  const handleTabChange = (id: string) => {
    setActiveCategoryId(id);
    setOpenIndex(0);
  };

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  const whatsappHref = whatsappLink(
    `Olá! Tenho uma dúvida sobre atendimento na ${clinic.name}.`
  );

  return (
    <section className="faq-section scroll-mt-[var(--header-height)]" id="duvidas-frequentes">
      <div className="container-page">
        <header className="faq-section-header">
          <p className="faq-section-eyebrow">Perguntas comuns</p>
          <h2 className="faq-section-heading">Dúvidas frequentes</h2>
          <p className="faq-section-lead">
            Respostas objetivas para empresas e RH sobre exames, documentos, orçamento e
            encaminhamentos.
          </p>
        </header>

        <div className="faq-layout">
          <div className="faq-main">
            <div className="faq-tabs" role="tablist" aria-label="Categorias de perguntas">
              {FAQ_CATEGORIES.map((category) => {
                const isActive = category.id === activeCategoryId;
                const Icon = CATEGORY_ICONS[category.id] ?? HelpCircle;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={cn("faq-tab", isActive && "faq-tab-active")}
                    onClick={() => handleTabChange(category.id)}
                  >
                    <Icon className="faq-tab-icon" strokeWidth={1.75} aria-hidden />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="faq-list" role="tabpanel" aria-label={activeCategory.label}>
              {activeCategory.items.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={item.question}
                    className={cn("faq-item", isOpen && "faq-item-open")}
                  >
                    <button
                      type="button"
                      className="faq-item-trigger"
                      aria-expanded={isOpen}
                      onClick={() => toggleItem(index)}
                    >
                      <span className="faq-item-question">{item.question}</span>
                      <span className={cn("faq-item-chevron", isOpen && "faq-item-chevron-open")}>
                        <ChevronDown strokeWidth={2} aria-hidden />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="panel"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="faq-item-panel-wrap"
                        >
                          <div className="faq-item-panel">
                            <p className="faq-item-answer">{item.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="faq-sidebar">
            <div className="faq-help-card">
              <div className="faq-help-card-accent" aria-hidden />
              <div className="faq-help-card-icon" aria-hidden>
                <HelpCircle strokeWidth={1.75} />
              </div>
              <h3 className="faq-help-card-title">Precisa de ajuda?</h3>
              <p className="faq-help-card-text">
                Fale com a equipe da Unimetra para tirar dúvidas sobre exames, documentos,
                orçamento ou encaminhamento de colaboradores.
              </p>

              <div className="faq-help-card-actions">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <Button variant="brand" className="w-full rounded-xl">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Falar no WhatsApp
                  </Button>
                </a>
                <Link href="/contato">
                  <Button variant="outline" className="w-full rounded-xl">
                    Falar com a equipe
                  </Button>
                </Link>
              </div>

              <ul className="faq-help-card-meta">
                <li>
                  <Building2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  Atendimento para empresas
                </li>
                <li>
                  <Stethoscope className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  Medicina e Segurança do Trabalho
                </li>
                <li>
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  {config.city} — {config.state}
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
