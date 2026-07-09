"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, ExternalLink, User } from "lucide-react";
import { ExpandableTabs } from "@/components/dashboard/ExpandableTabs";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type TopbarExpandableActionsProps = {
  userName: string;
};

export function TopbarExpandableActions({ userName }: TopbarExpandableActionsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.items ?? []))
      .catch(() => undefined);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;
  const firstName = userName.split(" ").filter(Boolean)[0] ?? "Conta";

  const tabs = useMemo(
    () =>
      [
        {
          title: "Ver site",
          icon: ExternalLink,
          href: "/",
          target: "_blank",
        },
        { type: "separator" as const },
        {
          title: "Notificações",
          icon: Bell,
          badge: unread,
        },
        { type: "separator" as const },
        {
          title: firstName,
          icon: User,
          href: "/dashboard/configuracoes",
        },
      ] as const,
    [unread, firstName]
  );

  const notificationsTabIndex = tabs.findIndex(
    (tab) => "title" in tab && tab.title === "Notificações"
  );

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST" });
    setNotifications((items) => items.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative">
      <ExpandableTabs
        tabs={[...tabs]}
        onChange={(index) => {
          setPanelOpen(index === notificationsTabIndex);
        }}
      />

      {panelOpen && (
        <div
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-xl",
            "border border-[var(--dash-border)] bg-white shadow-[var(--dash-shadow-md)]"
          )}
        >
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
            <ul className="max-h-80 overflow-y-auto p-1">
              {notifications.slice(0, 8).map((n) => (
                <li key={n.id}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      className="block rounded-lg px-3 py-2.5 transition hover:bg-slate-50"
                      onClick={() => setPanelOpen(false)}
                    >
                      <p className="text-sm font-semibold text-[var(--brand-navy)]">{n.title}</p>
                      <p className="text-xs text-[var(--dash-text-muted)]">{n.message}</p>
                    </Link>
                  ) : (
                    <div className="rounded-lg px-3 py-2.5">
                      <p className="text-sm font-semibold text-[var(--brand-navy)]">{n.title}</p>
                      <p className="text-xs text-[var(--dash-text-muted)]">{n.message}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
