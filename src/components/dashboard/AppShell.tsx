import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

/**
 * Camada visual do painel (inspirada em app shells SaaS).
 * Estrutura fixa: sidebar + área principal com topbar e conteúdo.
 */
export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="app-shell">
      {sidebar}
      <div className="app-shell-main">
        {topbar}
        <main className="app-shell-content">
          <div className="app-shell-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
