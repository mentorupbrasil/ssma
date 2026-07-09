"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isPublicNavActive, type PublicNavItem } from "@/lib/public-nav";

type PublicNavBarProps = {
  items: PublicNavItem[];
  className?: string;
  /** inline = centro do header (desktop); bottom = barra fixa no rodapé (mobile) */
  variant?: "inline" | "bottom";
};

export function PublicNavBar({ items, className, variant = "inline" }: PublicNavBarProps) {
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeItem = items.find((item) => isPublicNavActive(pathname, item.url));
  const showIconsOnly = variant === "bottom" || (variant === "inline" && isCompact);

  return (
    <div
      className={cn(
        variant === "inline" && "hidden lg:block",
        variant === "bottom" &&
          "fixed bottom-0 left-1/2 z-50 mb-4 w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 lg:hidden",
        className
      )}
    >
      <nav
        aria-label="Navegação principal"
        className={cn(
          "flex items-center gap-0.5 rounded-full border border-slate-200/80 bg-white/75 px-1 py-1 shadow-[0_8px_32px_rgb(15_61_74/0.12)] backdrop-blur-lg",
          variant === "bottom" && "overflow-x-auto scrollbar-none"
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem?.url === item.url;

          return (
            <Link
              key={item.url}
              href={item.url}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative shrink-0 cursor-pointer rounded-full px-3 py-2 text-sm font-semibold transition-colors sm:px-4",
                "text-slate-600 hover:text-[var(--brand-green)]",
                isActive && "text-[var(--brand-navy)]"
              )}
            >
              {showIconsOnly ? (
                <>
                  <Icon size={18} strokeWidth={2.5} aria-hidden />
                  <span className="sr-only">{item.name}</span>
                </>
              ) : (
                <span>{item.name}</span>
              )}

              {isActive && (
                <motion.div
                  layoutId="public-nav-lamp"
                  className="absolute inset-0 -z-10 w-full rounded-full bg-[var(--brand-green)]/8"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-[var(--brand-green)]">
                    <div className="absolute -left-2 -top-2 h-6 w-12 rounded-full bg-[var(--brand-green)]/25 blur-md" />
                    <div className="absolute -top-1 h-6 w-8 rounded-full bg-[var(--brand-green)]/20 blur-md" />
                    <div className="absolute left-2 top-0 h-4 w-4 rounded-full bg-[var(--brand-green)]/20 blur-sm" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
