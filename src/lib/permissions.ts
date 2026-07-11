import type { UserRole } from "@/types/roles";
import { normalizeRole, isSuperAdmin, isCompanyHr } from "@/lib/tenant";

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  CLINIC_ADMIN: "Administrador da clínica",
  RECEPTION: "Recepção",
  COMMERCIAL: "Comercial",
  FINANCIAL: "Financeiro",
  SST_TECHNICIAN: "Técnico SST",
  HEALTH_PROFESSIONAL: "Profissional de saúde",
  COMPANY_HR: "Empresa / RH",
  READ_ONLY: "Somente leitura",
  ADMIN: "Administrador",
  RECEPCAO: "Recepção",
  MEDICO: "Médico",
  TECNICO: "Técnico",
  FINANCEIRO: "Financeiro",
  EMPRESA: "Empresa",
  VISUALIZADOR: "Visualizador",
};

export type Permission =
  | "dashboard.view"
  | "companies.manage"
  | "patients.manage"
  | "referrals.manage"
  | "appointments.manage"
  | "exams.manage"
  | "exams.view"
  | "leads.manage"
  | "documents.manage"
  | "closings.manage"
  | "financial.manage"
  | "pricing.manage"
  | "tasks.manage"
  | "tickets.manage"
  | "sst_assistant.manage"
  | "users.manage"
  | "settings.manage"
  | "audit.view"
  | "superadmin.access";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: ["superadmin.access"],
  CLINIC_ADMIN: [
    "dashboard.view",
    "companies.manage",
    "patients.manage",
    "referrals.manage",
    "appointments.manage",
    "exams.manage",
    "exams.view",
    "leads.manage",
    "documents.manage",
    "closings.manage",
    "financial.manage",
    "pricing.manage",
    "tasks.manage",
    "tickets.manage",
    "sst_assistant.manage",
    "users.manage",
    "settings.manage",
    "audit.view",
  ],
  RECEPTION: [
    "dashboard.view",
    "companies.manage",
    "patients.manage",
    "referrals.manage",
    "appointments.manage",
    "exams.view",
    "documents.manage",
    "leads.manage",
    "tasks.manage",
    "tickets.manage",
  ],
  COMMERCIAL: [
    "dashboard.view",
    "companies.manage",
    "leads.manage",
    "pricing.manage",
    "exams.view",
    "documents.manage",
    "tasks.manage",
    "tickets.manage",
  ],
  FINANCIAL: [
    "dashboard.view",
    "companies.manage",
    "leads.manage",
    "exams.view",
    "documents.manage",
    "closings.manage",
    "financial.manage",
    "pricing.manage",
    "tasks.manage",
    "tickets.manage",
  ],
  SST_TECHNICIAN: [
    "dashboard.view",
    "referrals.manage",
    "appointments.manage",
    "exams.manage",
    "exams.view",
    "documents.manage",
    "tasks.manage",
    "tickets.manage",
    "sst_assistant.manage",
  ],
  HEALTH_PROFESSIONAL: [
    "dashboard.view",
    "patients.manage",
    "referrals.manage",
    "appointments.manage",
    "exams.view",
    "documents.manage",
    "tasks.manage",
  ],
  COMPANY_HR: [
    "dashboard.view",
    "patients.manage",
    "referrals.manage",
    "appointments.manage",
    "exams.view",
    "documents.manage",
    "tickets.manage",
  ],
  READ_ONLY: ["dashboard.view", "exams.view"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const normalized = normalizeRole(role);
  if (normalized === "SUPER_ADMIN") {
    return permission === "superadmin.access";
  }
  return ROLE_PERMISSIONS[normalized]?.includes(permission) ?? false;
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const normalized = normalizeRole(role);

  if (normalized === "SUPER_ADMIN") {
    return pathname.startsWith("/super-admin");
  }

  if (pathname.startsWith("/super-admin")) {
    return false;
  }

  if (normalized === "CLINIC_ADMIN") return true;

  const routePermissions: { prefix: string; permission: Permission }[] = [
    { prefix: "/dashboard/empresas", permission: "companies.manage" },
    { prefix: "/dashboard/colaboradores", permission: "patients.manage" },
    { prefix: "/dashboard/pacientes", permission: "patients.manage" },
    { prefix: "/dashboard/pre-encaminhamentos", permission: "referrals.manage" },
    { prefix: "/dashboard/encaminhamentos", permission: "referrals.manage" },
    { prefix: "/dashboard/documentos", permission: "documents.manage" },
    { prefix: "/dashboard/fechamento-mensal", permission: "closings.manage" },
    { prefix: "/dashboard/financeiro", permission: "financial.manage" },
    { prefix: "/dashboard/tabela-precos", permission: "pricing.manage" },
    { prefix: "/dashboard/orcamentos", permission: "leads.manage" },
    { prefix: "/dashboard/tarefas", permission: "tasks.manage" },
    { prefix: "/dashboard/chamados", permission: "tickets.manage" },
    { prefix: "/dashboard/assistente-sst", permission: "sst_assistant.manage" },
    { prefix: "/dashboard/agenda", permission: "appointments.manage" },
    { prefix: "/dashboard/exames", permission: "exams.view" },
    { prefix: "/dashboard/usuarios", permission: "users.manage" },
    { prefix: "/dashboard/configuracoes", permission: "settings.manage" },
    { prefix: "/dashboard/conteudo", permission: "settings.manage" },
    { prefix: "/dashboard/auditoria", permission: "audit.view" },
  ];

  const match = routePermissions.find((r) => pathname.startsWith(r.prefix));
  if (!match) return true;
  return hasPermission(role, match.permission);
}

export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Visão geral", icon: "LayoutDashboard", permission: "dashboard.view" as Permission },
  { href: "/dashboard/empresas", label: "Empresas", icon: "Building2", permission: "companies.manage" as Permission },
  { href: "/dashboard/colaboradores", label: "Colaboradores", icon: "Users", permission: "patients.manage" as Permission },
  { href: "/dashboard/encaminhamentos", label: "Fila de atendimentos", icon: "FileText", permission: "referrals.manage" as Permission },
  { href: "/dashboard/documentos", label: "Documentos", icon: "FolderOpen", permission: "documents.manage" as Permission },
  { href: "/dashboard/exames", label: "Exames", icon: "Stethoscope", permission: "exams.view" as Permission },
  { href: "/dashboard/orcamentos", label: "Comercial", icon: "DollarSign", permission: "leads.manage" as Permission },
  { href: "/dashboard/tabela-precos", label: "Tabela de preços", icon: "Tags", permission: "pricing.manage" as Permission },
  { href: "/dashboard/fechamento-mensal", label: "Fechamento mensal", icon: "Calculator", permission: "closings.manage" as Permission },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: "Wallet", permission: "financial.manage" as Permission },
  { href: "/dashboard/tarefas", label: "Tarefas", icon: "CheckSquare", permission: "tasks.manage" as Permission },
  { href: "/dashboard/chamados", label: "Chamados", icon: "LifeBuoy", permission: "tickets.manage" as Permission },
  { href: "/dashboard/assistente-sst", label: "Assistente SST", icon: "Sparkles", permission: "sst_assistant.manage" as Permission },
  { href: "/dashboard/usuarios", label: "Usuários", icon: "UserCog", permission: "users.manage" as Permission },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: "Settings", permission: "settings.manage" as Permission },
  { href: "/dashboard/conteudo", label: "Conteúdo", icon: "Newspaper", permission: "settings.manage" as Permission },
  { href: "/dashboard/auditoria", label: "Auditoria", icon: "Shield", permission: "audit.view" as Permission },
];

export const SUPER_ADMIN_NAV = [
  { href: "/super-admin", label: "Visão geral", icon: "LayoutDashboard" },
  { href: "/super-admin/clinicas", label: "Clínicas", icon: "Building2" },
  { href: "/super-admin/chamados", label: "Chamados", icon: "LifeBuoy" },
  { href: "/super-admin/configuracoes", label: "Configurações", icon: "Settings" },
];

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[normalizeRole(role)] ?? role;
}

export { isSuperAdmin, isCompanyHr };
