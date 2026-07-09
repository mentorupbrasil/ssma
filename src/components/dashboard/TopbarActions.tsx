"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { globalSearch, type SearchResult } from "@/actions/search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function TopbarSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pending, startTransition] = useTransition();

  function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const items = await globalSearch(value);
      setResults(items);
    });
  }

  return (
    <div className="topbar-search-shell hidden md:block">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-text-subtle)]"
        strokeWidth={2}
      />
      <Input
        placeholder="Buscar empresas, colaboradores, protocolos, documentos, orçamentos..."
        className="topbar-search-input"
        value={query}
        onChange={(e) => runSearch(e.target.value)}
      />
      {results.length > 0 && (
        <div className="topbar-search-results absolute z-50 mt-2 w-full p-1.5">
          {results.map((r) => (
            <Link
              key={`${r.type}-${r.id}`}
              href={r.href}
              className="topbar-search-result block rounded-lg"
              onClick={() => setResults([])}
            >
              <p className="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--dash-text-subtle)]">
                {r.type}
              </p>
              <p className="text-sm font-semibold text-[var(--brand-navy)]">{r.title}</p>
              <p className="text-xs text-[var(--dash-text-muted)]">{r.subtitle}</p>
            </Link>
          ))}
        </div>
      )}
      {pending && query.length >= 2 && results.length === 0 && (
        <div className="topbar-search-results absolute z-50 mt-2 w-full p-3 text-sm text-[var(--dash-text-muted)]">
          Buscando...
        </div>
      )}
    </div>
  );
}

export function TopbarNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.items ?? []))
      .catch(() => undefined);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST" });
    setNotifications((items) => items.map((n) => ({ ...n, read: true })));
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="topbar-icon-btn relative">
            <Bell className="h-4 w-4 text-slate-600" strokeWidth={2} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unread}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 rounded-xl border-[var(--dash-border)] shadow-[var(--dash-shadow-md)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <span className="text-sm font-bold text-[var(--brand-navy)]">Notificações</span>
          {unread > 0 && (
            <button
              type="button"
              className="text-xs font-semibold text-[var(--brand-green)] hover:underline"
              onClick={markAllRead}
            >
              Marcar todas lidas
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="p-4 text-sm text-[var(--dash-text-muted)]">Nenhuma notificação no momento.</p>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 rounded-lg p-3">
              {n.link ? (
                <Link href={n.link} className="font-semibold text-[var(--brand-navy)]">
                  {n.title}
                </Link>
              ) : (
                <span className="font-semibold text-[var(--brand-navy)]">{n.title}</span>
              )}
              <span className="text-xs text-[var(--dash-text-muted)]">{n.message}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
