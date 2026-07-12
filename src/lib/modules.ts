/**
 * Feature flags centralizadas dos módulos do painel Unimetra.
 * Altere para `true` para reativar um módulo (dados e rotas permanecem intactos).
 *
 * Não incluir "conteúdo/blog" — módulo removido do painel e não deve ser restaurado aqui.
 */
export const MODULE_FLAGS = {
  commercial: false,
  pricing: false,
  monthlyClosing: false,
  finance: false,
  sstAssistant: false,
  tasks: false,
  examCatalog: false,
  tickets: true,
  companies: true,
  collaborators: true,
  referrals: true,
  documents: true,
  users: true,
  settings: true,
  subscription: true,
  audit: true,
} as const;

export type ModuleFlagKey = keyof typeof MODULE_FLAGS;

/** Identificadores estáveis usados em nav, rotas e helpers. */
export type AppModuleId =
  | "commercial"
  | "pricing"
  | "monthlyClosing"
  | "finance"
  | "sstAssistant"
  | "tasks"
  | "examCatalog"
  | "tickets"
  | "companies"
  | "collaborators"
  | "referrals"
  | "documents"
  | "users"
  | "settings"
  | "subscription"
  | "audit"
  | "dashboard";

const MODULE_TO_FLAG: Record<AppModuleId, ModuleFlagKey | null> = {
  dashboard: null,
  companies: "companies",
  collaborators: "collaborators",
  referrals: "referrals",
  documents: "documents",
  tickets: "tickets",
  users: "users",
  settings: "settings",
  subscription: "subscription",
  audit: "audit",
  commercial: "commercial",
  pricing: "pricing",
  monthlyClosing: "monthlyClosing",
  finance: "finance",
  sstAssistant: "sstAssistant",
  tasks: "tasks",
  examCatalog: "examCatalog",
};

/** Prefixo de rota → módulo. Ordem: rotas mais específicas primeiro. */
const ROUTE_MODULE_PREFIXES: { prefix: string; module: AppModuleId }[] = [
  { prefix: "/dashboard/orcamentos", module: "commercial" },
  { prefix: "/dashboard/contatos", module: "commercial" },
  { prefix: "/dashboard/tabela-precos", module: "pricing" },
  { prefix: "/dashboard/fechamento-mensal", module: "monthlyClosing" },
  { prefix: "/dashboard/financeiro", module: "finance" },
  { prefix: "/dashboard/assistente-sst", module: "sstAssistant" },
  { prefix: "/dashboard/tarefas", module: "tasks" },
  { prefix: "/dashboard/exames", module: "examCatalog" },
  { prefix: "/dashboard/chamados", module: "tickets" },
  { prefix: "/dashboard/empresas", module: "companies" },
  { prefix: "/dashboard/colaboradores", module: "collaborators" },
  { prefix: "/dashboard/pacientes", module: "collaborators" },
  { prefix: "/dashboard/encaminhamentos", module: "referrals" },
  { prefix: "/dashboard/pre-encaminhamentos", module: "referrals" },
  { prefix: "/dashboard/agenda", module: "referrals" },
  { prefix: "/dashboard/documentos", module: "documents" },
  { prefix: "/dashboard/usuarios", module: "users" },
  { prefix: "/dashboard/configuracoes", module: "settings" },
  { prefix: "/dashboard/assinatura", module: "subscription" },
  { prefix: "/dashboard/auditoria", module: "audit" },
  { prefix: "/dashboard", module: "dashboard" },
];

const PERMISSION_MODULE: Record<string, AppModuleId> = {
  "leads.manage": "commercial",
  "pricing.manage": "pricing",
  "closings.manage": "monthlyClosing",
  "financial.manage": "finance",
  "sst_assistant.manage": "sstAssistant",
  "tasks.manage": "tasks",
  "exams.view": "examCatalog",
  "exams.manage": "examCatalog",
  "tickets.manage": "tickets",
  "companies.manage": "companies",
  "patients.manage": "collaborators",
  "referrals.manage": "referrals",
  "appointments.manage": "referrals",
  "documents.manage": "documents",
  "users.manage": "users",
  "settings.manage": "settings",
  "subscription.manage": "subscription",
  "audit.view": "audit",
};

export function isModuleEnabled(moduleId: AppModuleId): boolean {
  const flag = MODULE_TO_FLAG[moduleId];
  if (flag == null) return true;
  return MODULE_FLAGS[flag] === true;
}

export function getModuleFlags() {
  return { ...MODULE_FLAGS };
}

export function getModuleForPath(pathname: string): AppModuleId | null {
  const path = pathname.split("?")[0] || pathname;
  for (const entry of ROUTE_MODULE_PREFIXES) {
    if (path === entry.prefix || path.startsWith(`${entry.prefix}/`)) {
      return entry.module;
    }
  }
  return null;
}

/** Retorna false se a rota pertence a um módulo desativado. */
export function isPathModuleEnabled(pathname: string): boolean {
  const moduleId = getModuleForPath(pathname);
  if (!moduleId) return true;
  return isModuleEnabled(moduleId);
}

export function getDisabledModuleRedirect(): string {
  return "/dashboard";
}

/** Permissão ligada a módulo desativado não deve aparecer em atalhos/gestão de perfis. */
export function isPermissionModuleEnabled(permission: string): boolean {
  const moduleId = PERMISSION_MODULE[permission];
  if (!moduleId) return true;
  return isModuleEnabled(moduleId);
}

/** Filtra itens com `href` para módulos ativos. */
export function filterEnabledHrefItems<T extends { href: string }>(items: T[]): T[] {
  return items.filter((item) => isPathModuleEnabled(item.href));
}

/** Filtra seções de nav removendo hrefs desativados e seções vazias. */
export function filterNavSections<T extends { label: string; hrefs: readonly string[] | string[] }>(
  sections: T[]
): Array<Omit<T, "hrefs"> & { hrefs: string[] }> {
  return sections
    .map((section) => ({
      ...section,
      hrefs: [...section.hrefs].filter((href) => isPathModuleEnabled(href)),
    }))
    .filter((section) => section.hrefs.length > 0);
}

export function isCommercialModuleEnabled() {
  return isModuleEnabled("commercial");
}

export function isPricingModuleEnabled() {
  return isModuleEnabled("pricing");
}

export function isExamCatalogModuleEnabled() {
  return isModuleEnabled("examCatalog");
}

export function isFinanceModuleEnabled() {
  return isModuleEnabled("finance");
}

export function isTasksModuleEnabled() {
  return isModuleEnabled("tasks");
}

export function isMonthlyClosingModuleEnabled() {
  return isModuleEnabled("monthlyClosing");
}

export function isSstAssistantModuleEnabled() {
  return isModuleEnabled("sstAssistant");
}

export function isTicketsModuleEnabled() {
  return isModuleEnabled("tickets");
}

/** Aba Contrato/exames da empresa depende de comercial, preços ou catálogo. */
export function isCompanyContractTabEnabled() {
  return (
    isCommercialModuleEnabled() ||
    isPricingModuleEnabled() ||
    isExamCatalogModuleEnabled()
  );
}

/** Origens de tarefa automática que não devem ser geradas quando o módulo está off. */
export function shouldCreateAutoTaskForOrigin(origin: string | null | undefined): boolean {
  if (!isTasksModuleEnabled()) return false;
  switch (origin) {
    case "FECHAMENTO":
      return isMonthlyClosingModuleEnabled();
    case "COMERCIAL":
      return isCommercialModuleEnabled();
    case "FINANCEIRO":
      return isFinanceModuleEnabled();
    default:
      return true;
  }
}
