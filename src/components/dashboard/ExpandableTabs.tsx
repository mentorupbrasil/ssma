"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  href?: string;
  target?: string;
  onClick?: () => void;
  badge?: number;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
}

export type ExpandableTabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: ExpandableTabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const springTransition = {
  delay: 0.1,
  type: "spring" as const,
  bounce: 0,
  duration: 0.6,
};

function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  handler: () => void
) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-[var(--brand-green)]",
  onChange,
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef<HTMLDivElement>(null);

  const clearSelection = React.useCallback(() => {
    setSelected(null);
    onChange?.(null);
  }, [onChange]);

  useOnClickOutside(outsideClickRef, clearSelection);

  const handleSelect = (index: number) => {
    const tab = tabs[index];
    if (!tab || tab.type === "separator") return;

    if (selected === index) {
      if (tab.href) {
        if (tab.target === "_blank") {
          window.open(tab.href, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = tab.href;
        }
      }
      tab.onClick?.();
      return;
    }

    setSelected(index);
    onChange?.(index);
    tab.onClick?.();
  };

  const TabSeparator = () => (
    <div className="mx-0.5 h-6 w-px bg-[var(--dash-border)]" aria-hidden="true" />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--dash-border)] bg-white/90 p-1 shadow-[var(--dash-shadow-sm)]",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <TabSeparator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        const isSelected = selected === index;

        return (
          <motion.button
            key={`${tab.title}-${index}`}
            type="button"
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={() => handleSelect(index)}
            transition={springTransition}
            className={cn(
              "relative flex items-center rounded-xl px-2 py-2 text-sm font-medium transition-colors duration-300",
              isSelected
                ? cn("bg-[var(--brand-green-light)]/60", activeColor)
                : "text-[var(--dash-text-muted)] hover:bg-slate-50 hover:text-[var(--brand-navy)]"
            )}
            aria-label={tab.title}
            aria-pressed={isSelected}
          >
            <Icon size={18} strokeWidth={2} />
            {tab.badge != null && tab.badge > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {tab.badge > 9 ? "9+" : tab.badge}
              </span>
            )}
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={springTransition}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
