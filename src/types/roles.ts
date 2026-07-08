export const USER_ROLES = [
  "SUPER_ADMIN",
  "CLINIC_ADMIN",
  "RECEPTION",
  "COMMERCIAL",
  "FINANCIAL",
  "SST_TECHNICIAN",
  "HEALTH_PROFESSIONAL",
  "COMPANY_HR",
  "READ_ONLY",
  // Legados (compatibilidade)
  "ADMIN",
  "RECEPCAO",
  "MEDICO",
  "TECNICO",
  "FINANCEIRO",
  "EMPRESA",
  "VISUALIZADOR",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const CLINIC_STAFF_ROLES = [
  "CLINIC_ADMIN",
  "RECEPTION",
  "COMMERCIAL",
  "FINANCIAL",
  "SST_TECHNICIAN",
  "HEALTH_PROFESSIONAL",
  "READ_ONLY",
] as const;

export const LEGACY_ROLES = [
  "ADMIN",
  "RECEPCAO",
  "MEDICO",
  "TECNICO",
  "FINANCEIRO",
  "EMPRESA",
  "VISUALIZADOR",
] as const;
