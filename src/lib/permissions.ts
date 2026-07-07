import type { UserRole } from "@/types/roles";

export const ROLE_LABELS: Record<UserRole, string> = {
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
  | "leads.manage"
  | "documents.manage"
  | "users.manage"
  | "settings.manage"
  | "audit.view";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "dashboard.view",
    "companies.manage",
    "patients.manage",
    "referrals.manage",
    "appointments.manage",
    "exams.manage",
    "leads.manage",
    "documents.manage",
    "users.manage",
    "settings.manage",
    "audit.view",
  ],
  RECEPCAO: [
    "dashboard.view",
    "companies.manage",
    "patients.manage",
    "referrals.manage",
    "appointments.manage",
    "documents.manage",
    "leads.manage",
  ],
  MEDICO: [
    "dashboard.view",
    "patients.manage",
    "referrals.manage",
    "appointments.manage",
    "documents.manage",
  ],
  TECNICO: [
    "dashboard.view",
    "referrals.manage",
    "appointments.manage",
    "exams.manage",
    "documents.manage",
  ],
  FINANCEIRO: [
    "dashboard.view",
    "companies.manage",
    "leads.manage",
    "documents.manage",
  ],
  EMPRESA: [
    "dashboard.view",
    "patients.manage",
    "referrals.manage",
    "appointments.manage",
    "documents.manage",
  ],
  VISUALIZADOR: ["dashboard.view"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === "ADMIN") return true;

  const routePermissions: { prefix: string; permission: Permission }[] = [
    { prefix: "/dashboard/empresas", permission: "companies.manage" },
    { prefix: "/dashboard/pacientes", permission: "patients.manage" },
    { prefix: "/dashboard/encaminhamentos", permission: "referrals.manage" },
    { prefix: "/dashboard/agenda", permission: "appointments.manage" },
    { prefix: "/dashboard/exames", permission: "exams.manage" },
    { prefix: "/dashboard/orcamentos", permission: "leads.manage" },
    { prefix: "/dashboard/documentos", permission: "documents.manage" },
    { prefix: "/dashboard/usuarios", permission: "users.manage" },
    { prefix: "/dashboard/configuracoes", permission: "settings.manage" },
    { prefix: "/dashboard/auditoria", permission: "audit.view" },
  ];

  const match = routePermissions.find((r) => pathname.startsWith(r.prefix));
  if (!match) return true;
  return hasPermission(role, match.permission);
}

export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Visão geral", icon: "LayoutDashboard", permission: "dashboard.view" as Permission },
  { href: "/dashboard/encaminhamentos", label: "Encaminhamentos", icon: "FileText", permission: "referrals.manage" as Permission },
  { href: "/dashboard/agenda", label: "Agenda", icon: "Calendar", permission: "appointments.manage" as Permission },
  { href: "/dashboard/empresas", label: "Empresas", icon: "Building2", permission: "companies.manage" as Permission },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: "Users", permission: "patients.manage" as Permission },
  { href: "/dashboard/exames", label: "Exames", icon: "Stethoscope", permission: "exams.manage" as Permission },
  { href: "/dashboard/orcamentos", label: "Orçamentos", icon: "DollarSign", permission: "leads.manage" as Permission },
  { href: "/dashboard/documentos", label: "Documentos", icon: "FolderOpen", permission: "documents.manage" as Permission },
  { href: "/dashboard/usuarios", label: "Usuários", icon: "UserCog", permission: "users.manage" as Permission },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: "Settings", permission: "settings.manage" as Permission },
  { href: "/dashboard/auditoria", label: "Auditoria", icon: "Shield", permission: "audit.view" as Permission },
];
