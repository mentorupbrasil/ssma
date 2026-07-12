import type { Prisma } from "@prisma/client";
import { startOfDay, endOfDay, parseISO, isValid, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isModuleEnabled, type AppModuleId } from "@/lib/modules";

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  User: "Usuário",
  Company: "Empresa",
  Patient: "Colaborador",
  Referral: "Encaminhamento",
  Document: "Documento",
  Quote: "Orçamento",
  Lead: "Solicitação comercial",
  Appointment: "Agendamento",
  Task: "Tarefa",
  Ticket: "Chamado",
  FinancialEntry: "Lançamento financeiro",
  MonthlyClosing: "Fechamento mensal",
  PriceListItem: "Tabela de preços",
  ProductionImport: "Importação de produção",
  BlogPost: "Publicação",
  Setting: "Configuração",
  Exam: "Exame",
  PublicReferralRequest: "Pré-encaminhamento",
  RolePermissions: "Perfis e permissões",
  SstDraft: "Documento SST",
  ContactMessage: "Mensagem de contato",
  ReferralDocument: "Anexo de encaminhamento",
};

/** Entidade → módulo (feature flag). Sem mapeamento = oculto na UI. */
const AUDIT_ENTITY_MODULE: Record<string, AppModuleId | null> = {
  Company: "companies",
  Patient: "collaborators",
  Referral: "referrals",
  PublicReferralRequest: "referrals",
  Document: "documents",
  ReferralDocument: "documents",
  Ticket: "tickets",
  User: "users",
  RolePermissions: "users",
  Setting: "settings",
  Quote: "commercial",
  Lead: "commercial",
  ContactMessage: "commercial",
  PriceListItem: "pricing",
  Exam: "examCatalog",
  FinancialEntry: "finance",
  MonthlyClosing: "monthlyClosing",
  ProductionImport: "monthlyClosing",
  Task: "tasks",
  SstDraft: "sstAssistant",
  Appointment: null,
  BlogPost: null,
  Clinic: null,
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  UPSERT: "Salvamento",
  LOGIN: "Login",
  LOGOUT: "Logout",
  STATUS_CHANGE: "Alteração de status",
  DOWNLOAD: "Download",
  VIEW: "Visualização",
  SEED: "Carga inicial",
  SYNC: "Sincronização",
  IMPORT: "Importação",
};

/** Ações técnicas ocultas na listagem (registros permanecem no banco). */
export const AUDIT_HIDDEN_ACTIONS = new Set([
  "SEED",
  "SYNC",
  "IMPORT",
  "MIGRATE",
  "MIGRATION",
]);

/** Ações exibidas no filtro da UI. */
export const AUDIT_UI_ACTION_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(AUDIT_ACTION_LABELS).filter(([key]) => !AUDIT_HIDDEN_ACTIONS.has(key))
);

export function isAuditEntityVisible(entity: string): boolean {
  const moduleId = AUDIT_ENTITY_MODULE[entity];
  if (moduleId === undefined) return false;
  if (moduleId === null) return false;
  return isModuleEnabled(moduleId);
}

export function getVisibleAuditEntities(): string[] {
  return Object.keys(AUDIT_ENTITY_MODULE).filter((entity) => isAuditEntityVisible(entity));
}

export function getVisibleAuditEntityOptions(): { value: string; label: string }[] {
  return getVisibleAuditEntities()
    .map((value) => ({
      value,
      label: AUDIT_ENTITY_LABELS[value] ?? value,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export const CRITICAL_ENTITIES = new Set([
  "User",
  "FinancialEntry",
  "Document",
  "Setting",
  "PriceListItem",
]);

export type AuditFilters = {
  q?: string;
  entity?: string;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
};

export type AuditChangePair = {
  field?: string;
  before: string | null;
  after: string | null;
};

const PAGE_SIZE = 25;

export function getAuditPageSize() {
  return PAGE_SIZE;
}

function isAll(value?: string) {
  return !value || value === "ALL" || value === "all";
}

/** Cláusulas que ocultam logs técnicos e de módulos desativados (sem apagar dados). */
export function buildAuditVisibilityWhere(): Prisma.AuditLogWhereInput {
  const visibleEntities = getVisibleAuditEntities();
  return {
    AND: [
      {
        NOT: {
          OR: [
            { action: { equals: "SEED", mode: "insensitive" } },
            { action: { equals: "SYNC", mode: "insensitive" } },
            { action: { equals: "IMPORT", mode: "insensitive" } },
            { action: { equals: "MIGRATE", mode: "insensitive" } },
            { action: { equals: "MIGRATION", mode: "insensitive" } },
            { action: { contains: "SEED", mode: "insensitive" } },
            {
              user: {
                is: {
                  OR: [
                    { name: { equals: "System", mode: "insensitive" } },
                    { name: { equals: "Sistema", mode: "insensitive" } },
                    { name: { equals: "Seed", mode: "insensitive" } },
                  ],
                },
              },
            },
            { details: { contains: "carga inicial", mode: "insensitive" } },
            { details: { contains: "seed", mode: "insensitive" } },
            { details: { contains: "migra", mode: "insensitive" } },
          ],
        },
      },
      visibleEntities.length > 0
        ? { entity: { in: visibleEntities } }
        : { id: "__none__" },
    ],
  };
}

export function buildAuditWhere(filters: AuditFilters): Prisma.AuditLogWhereInput {
  const clauses: Prisma.AuditLogWhereInput[] = [buildAuditVisibilityWhere()];

  const q = filters.q?.trim();
  if (q) {
    clauses.push({
      OR: [
        { action: { contains: q, mode: "insensitive" } },
        { details: { contains: q, mode: "insensitive" } },
        { entity: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const visibleEntities = getVisibleAuditEntities();
  if (!isAll(filters.entity)) {
    clauses.push(
      visibleEntities.includes(filters.entity!)
        ? { entity: filters.entity }
        : { entity: { in: [] } }
    );
  }

  if (!isAll(filters.action)) {
    const actionUpper = filters.action!.toUpperCase();
    clauses.push(
      AUDIT_HIDDEN_ACTIONS.has(actionUpper)
        ? { action: { in: [] } }
        : { action: filters.action }
    );
  }

  if (!isAll(filters.userId)) {
    clauses.push({ userId: filters.userId });
  }

  const range: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) {
    const d = parseISO(filters.dateFrom);
    if (isValid(d)) range.gte = startOfDay(d);
  }
  if (filters.dateTo) {
    const d = parseISO(filters.dateTo);
    if (isValid(d)) range.lte = endOfDay(d);
  }
  if (Object.keys(range).length) {
    clauses.push({ createdAt: range });
  }

  return { AND: clauses };
}

export function translateEntity(entity: string) {
  return AUDIT_ENTITY_LABELS[entity] ?? entity;
}

export function translateAction(action: string) {
  const upper = action.toUpperCase();
  if (upper === "SEED") return "Carga inicial do sistema";
  return AUDIT_ACTION_LABELS[action] ?? AUDIT_ACTION_LABELS[upper] ?? action;
}

export function formatAuditActor(userName: string | null | undefined) {
  if (!userName?.trim()) return "Ação automática do sistema";
  const normalized = userName.trim();
  if (/^(system|sistema|seed)$/i.test(normalized)) return "Ação automática do sistema";
  return normalized;
}

export function isCriticalAudit(entity: string, action: string) {
  return CRITICAL_ENTITIES.has(entity) || action === "DELETE";
}

function tryParseJson(details: string | null | undefined): Record<string, unknown> | null {
  if (!details?.trim()) return null;
  const trimmed = details.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return null;
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Extrai valores anteriores/novos quando o detalhe segue padrões conhecidos. */
export function parseAuditChanges(details: string | null | undefined): AuditChangePair[] {
  if (!details?.trim()) return [];
  const json = tryParseJson(details);
  if (json) {
    const pairs: AuditChangePair[] = [];
    const before = (json.before ?? json.old ?? json.previous) as Record<string, unknown> | undefined;
    const after = (json.after ?? json.new ?? json.current) as Record<string, unknown> | undefined;
    if (before && after && typeof before === "object" && typeof after === "object") {
      const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
      for (const key of keys) {
        pairs.push({
          field: key,
          before: before[key] == null ? null : String(before[key]),
          after: after[key] == null ? null : String(after[key]),
        });
      }
      return pairs;
    }
  }

  const pairs: AuditChangePair[] = [];
  const statusArrow = details.match(/Status(?:\s*alterado)?(?:\s*para)?[:\s]+([^\s→\-]+)(?:\s*(?:→|->|para)\s*([^\s—]+))?/i);
  if (statusArrow?.[1] && statusArrow?.[2]) {
    pairs.push({ field: "Status", before: statusArrow[1], after: statusArrow[2] });
  }

  const dePara = details.match(/de\s+(.+?)\s+para\s+(.+)$/i);
  if (dePara) {
    pairs.push({ before: dePara[1].trim(), after: dePara[2].trim() });
  }

  const price = details.match(/(?:R\$\s*)?([\d.,]+)\s*(?:→|->)\s*(?:R\$\s*)?([\d.,]+)/);
  if (price) {
    pairs.push({
      field: "Valor",
      before: formatMoneyLike(price[1]),
      after: formatMoneyLike(price[2]),
    });
  }

  return pairs;
}

function formatMoneyLike(value: string) {
  const n = Number(value.replace(/\./g, "").replace(",", "."));
  if (Number.isFinite(n) && /[\d]/.test(value)) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (value.includes("R$")) return value;
  return value;
}

function competenceLabel(details: string) {
  const monthYear = details.match(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*[\/\s\-]*(20\d{2})/i);
  if (monthYear) {
    const map: Record<string, string> = {
      jan: "janeiro",
      fev: "fevereiro",
      mar: "março",
      abr: "abril",
      mai: "maio",
      jun: "junho",
      jul: "julho",
      ago: "agosto",
      set: "setembro",
      out: "outubro",
      nov: "novembro",
      dez: "dezembro",
    };
    const key = monthYear[1].slice(0, 3).toLowerCase();
    return `${map[key] ?? monthYear[1]}/${monthYear[2]}`;
  }
  const iso = details.match(/(20\d{2})-(\d{2})/);
  if (iso) {
    const months = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    const m = Number(iso[2]) - 1;
    if (m >= 0 && m < 12) return `${months[m]}/${iso[1]}`;
  }
  return null;
}

export function formatAuditSummary(input: {
  action: string;
  entity: string;
  details: string | null;
  userName?: string | null;
}): string {
  const action = input.action.toUpperCase();
  const entity = translateEntity(input.entity);
  const details = input.details?.trim() ?? "";
  const actor = formatAuditActor(input.userName);

  if (action === "SEED") {
    return details
      ? `Carga inicial do sistema: ${details}`
      : `Carga inicial do sistema — ${entity}`;
  }

  if (input.entity === "MonthlyClosing") {
    const comp = competenceLabel(details);
    if (action === "CREATE") {
      return comp ? `Fechamento de ${comp} criado` : "Fechamento mensal criado";
    }
    if (details.toLowerCase().includes("financeiro")) {
      return comp
        ? `Fechamento de ${comp} enviado ao Financeiro`
        : "Fechamento enviado ao Financeiro";
    }
    if (action === "UPDATE") {
      return details ? `Fechamento atualizado: ${details}` : "Fechamento mensal atualizado";
    }
  }

  if (input.entity === "User") {
    const name = details || "usuário";
    if (action === "CREATE") return `Usuário ${name} criado`;
    if (action === "DELETE") return `Usuário ${name} excluído`;
    if (/inativ|desativ|INACTIVE/i.test(details)) return `Usuário ${name} desativado`;
    if (/ativ|ACTIVE/i.test(details) && !/criad/i.test(details)) return `Usuário ${name} ativado`;
    if (action === "UPDATE") return `Usuário ${name} atualizado`;
  }

  if (input.entity === "PriceListItem" || input.entity === "Exam") {
    const priceChange = details.match(/(.+?)\s+(?:alterado\s+)?(?:de\s+)?(R\$\s*[\d.,]+|[\d.,]+)\s+(?:para|→|->)\s+(R\$\s*[\d.,]+|[\d.,]+)/i);
    if (priceChange) {
      return `Preço do exame ${priceChange[1].trim()} alterado de ${formatMoneyLike(priceChange[2])} para ${formatMoneyLike(priceChange[3])}`;
    }
    if (action === "CREATE") return `${entity} “${details || "item"}” criado`;
    if (action === "UPDATE") return details ? `${entity} atualizado: ${details}` : `${entity} atualizado`;
    if (action === "DELETE") return `${entity} “${details || "item"}” excluído`;
  }

  if (input.entity === "RolePermissions") {
    return `Permissões do perfil atualizadas${details ? `: ${details}` : ""}`;
  }

  if (details) {
    if (/^Status:/i.test(details) || /→|->|para/.test(details)) {
      return `${entity}: ${details}`;
    }
    if (action === "CREATE") return `${entity} criado — ${details}`;
    if (action === "UPDATE" || action === "UPSERT") return `${entity} atualizado — ${details}`;
    if (action === "DELETE") return `${entity} excluído — ${details}`;
    if (action === "DOWNLOAD") return `Download de ${entity}: ${details}`;
    if (action === "LOGIN") return `Login realizado`;
    return `${translateAction(input.action)} em ${entity}: ${details}`;
  }

  switch (action) {
    case "CREATE":
      return `${entity} criado`;
    case "UPDATE":
    case "UPSERT":
      return `${entity} atualizado`;
    case "DELETE":
      return `${entity} excluído`;
    case "LOGIN":
      return `${actor} acessou o sistema`;
    case "LOGOUT":
      return `${actor} saiu do sistema`;
    case "DOWNLOAD":
      return `Download de ${entity}`;
    default:
      return `${translateAction(input.action)} — ${entity}`;
  }
}

export function formatAuditOrigin(input: {
  userName: string | null;
  action: string;
  ipAddress: string | null;
}) {
  if (!input.userName || /^(system|sistema|seed)$/i.test(input.userName)) {
    return "Origem automática (sistema)";
  }
  if (input.action.toUpperCase() === "SEED") return "Carga inicial do sistema";
  if (input.ipAddress) return "Ação manual pelo painel";
  return "Ação pelo painel";
}

export function formatAuditDateTime(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
}

export function auditLogsToCsv(
  rows: Array<{
    createdAt: string;
    userName: string | null;
    action: string;
    entity: string;
    details: string | null;
    ipAddress: string | null;
    summary: string;
  }>
) {
  const header = [
    "Data e hora",
    "Usuário",
    "Ação",
    "Módulo",
    "Resumo",
    "Detalhes",
    "IP",
  ];
  const lines = rows.map((r) =>
    [
      formatAuditDateTime(r.createdAt),
      formatAuditActor(r.userName),
      translateAction(r.action),
      translateEntity(r.entity),
      r.summary,
      r.details ?? "",
      r.ipAddress ?? "",
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(";")
  );
  return `\uFEFF${[header.join(";"), ...lines].join("\n")}`;
}
