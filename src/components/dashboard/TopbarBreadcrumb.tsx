"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Painel",
  empresas: "Empresas",
  colaboradores: "Colaboradores",
  "pre-encaminhamentos": "Pré-encaminhamentos",
  encaminhamentos: "Encaminhamentos",
  agenda: "Agenda",
  documentos: "Documentos",
  "fechamento-mensal": "Fechamento mensal",
  financeiro: "Financeiro",
  orcamentos: "Orçamentos",
  tarefas: "Tarefas",
  chamados: "Chamados",
  "assistente-sst": "Assistente SST",
  exames: "Exames",
  usuarios: "Usuários",
  configuracoes: "Configurações",
  auditoria: "Auditoria",
  novo: "Novo",
  editar: "Editar",
};

function labelFor(segment: string) {
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function TopbarBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "dashboard") {
    return null;
  }

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    return { href, label: labelFor(segment), isLast };
  });

  return (
    <nav aria-label="Localização no painel" className="topbar-breadcrumb">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden /> : null}
          {crumb.isLast ? (
            <span className="topbar-breadcrumb-current">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="topbar-breadcrumb-link">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
