"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQ_CATEGORIES } from "@/data/faq";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { cn } from "@/lib/utils";

export function FAQSection() {
  const clinic = getClinicInfo();
  const [activeCategoryId, setActiveCategoryId] = useState(FAQ_CATEGORIES[0].id);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const activeCategory =
    FAQ_CATEGORIES.find((c) => c.id === activeCategoryId) ?? FAQ_CATEGORIES[0];

  const handleTabChange = (id: string) => {
    setActiveCategoryId(id);
    setOpenIndex(null);
  };

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="faq-section scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <div className="faq-section-shell mx-auto max-w-3xl">
          <header className="faq-section-header">
            <p className="faq-section-eyebrow">Perguntas comuns</p>
            <h2 className="faq-section-heading">Dúvidas frequentes</h2>
          </header>

          <div className="faq-tabs" role="tablist" aria-label="Categorias de perguntas">
            {FAQ_CATEGORIES.map((category) => {
              const isActive = category.id === activeCategoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={cn("faq-tab", isActive && "faq-tab-active")}
                  onClick={() => handleTabChange(category.id)}
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          <div
            className="faq-list"
            role="tabpanel"
            aria-label={activeCategory.label}
          >
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
                    <span className={cn("faq-item-plus", isOpen && "faq-item-plus-open")}>
                      <Plus strokeWidth={2.25} aria-hidden />
                    </span>
                  </button>
                  <div className="faq-item-panel" hidden={!isOpen}>
                    <p className="faq-item-answer">{item.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="faq-cta-band">
            <p className="faq-cta-band-text">
              Ainda com dúvida? Veja{" "}
              <Link href="/contato?tipo=orcamento" className="faq-cta-link">
                orçamento e contato
              </Link>{" "}
              ou fale com a equipe no{" "}
              <a
                href={whatsappLink(`Olá! Tenho uma dúvida sobre atendimento na ${clinic.name}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="faq-cta-link"
              >
                WhatsApp
              </a>
              .
            </p>
            <Link href="/contato">
              <Button variant="outline" className="faq-cta-band-btn shrink-0 rounded-xl">
                Central de ajuda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
