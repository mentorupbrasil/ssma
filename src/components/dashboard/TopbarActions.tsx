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
    <div className="relative mt-3 hidden max-w-lg md:block">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar encaminhamentos, empresas, colaboradores..."
          className="h-10 rounded-xl border-slate-200/90 bg-white pl-10 shadow-none focus:bg-white"
          value={query}
          onChange={(e) => runSearch(e.target.value)}
        />
        {results.length > 0 && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            {results.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                href={r.href}
                className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                onClick={() => setResults([])}
              >
                <p className="text-xs font-semibold text-slate-500">{r.type}</p>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-slate-500">{r.subtitle}</p>
              </Link>
            ))}
          </div>
        )}
        {pending && query.length >= 2 && results.length === 0 && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border bg-white p-3 text-sm text-slate-500 shadow-lg">
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
            <Button variant="ghost" size="icon" className="relative rounded-xl border border-transparent hover:border-slate-200 hover:bg-white">
              <Bell className="h-4 w-4 text-slate-600" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Notificações</span>
            {unread > 0 && (
              <button type="button" className="text-xs text-[var(--brand-green)]" onClick={markAllRead}>
                Marcar todas lidas
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Nenhuma notificação.</p>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 p-3">
                {n.link ? (
                  <Link href={n.link} className="font-medium text-slate-800">{n.title}</Link>
                ) : (
                  <span className="font-medium text-slate-800">{n.title}</span>
                )}
                <span className="text-xs text-slate-500">{n.message}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
