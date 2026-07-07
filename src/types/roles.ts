export const USER_ROLES = [
  "ADMIN",
  "RECEPCAO",
  "MEDICO",
  "TECNICO",
  "FINANCEIRO",
  "EMPRESA",
  "VISUALIZADOR",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
