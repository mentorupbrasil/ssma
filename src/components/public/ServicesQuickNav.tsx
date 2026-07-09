"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

type ServicesQuickNavProps = {
  items: { id: string; label: string }[];
  className?: string;
};

export function ServicesQuickNav({ items, className }: ServicesQuickNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0, 0.15, 0.35, 0.55],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  const handleClick = (id: string, event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav
      className={cn("services-quick-nav", className)}
      aria-label="Categorias de serviços"
    >
      <div className="container-page">
        <ul className="services-quick-nav-list">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={cn("services-quick-nav-chip", isActive && "services-quick-nav-chip-active")}
                  aria-current={isActive ? "true" : undefined}
                  onClick={(event) => handleClick(item.id, event)}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
