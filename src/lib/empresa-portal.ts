import type { ReferralStatus } from "@prisma/client";
import { COLLABORATOR_STAT_CARDS } from "@/lib/collaborators";
import { APPOINTMENT_STAT_CARDS } from "@/lib/appointments";
import { TICKET_STAT_CARDS } from "@/lib/tickets";
import { isCompanyHr } from "@/lib/tenant";
import type { UserRole } from "@/types/roles";

export function isEmpresaPortalRole(role: UserRole): boolean {
  return isCompanyHr(role);
}

/** Itens ocultos no menu lateral do RH */
export const EMPRESA_HIDDEN_NAV_HREFS = [
  "/dashboard/pre-encaminhamentos",
  "/dashboard/agenda",
];

/** Rótulos customizados no menu do RH */
export const EMPRESA_NAV_LABEL_OVERRIDES: Record<string, string> = {
  "/dashboard/encaminhamentos": "Exames",
  "/dashboard/exames": "Preparos",
  "/dashboard/documentos": "Documentos",
};

/** Ícones customizados no menu do RH */
export const EMPRESA_NAV_ICON_OVERRIDES: Record<string, string> = {
  "/dashboard/encaminhamentos": "ClipboardList",
};

export const EMPRESA_EXAMES_BASE_PATH = "/dashboard/encaminhamentos";

export type EmpresaReferralCardKey =
  | "AGENDADOS"
  | "AGUARDANDO_DOCUMENTO"
  | "ASO_DISPONIVEL"
  | "ASO_PENDENTE";

export type EmpresaReferralCard = {
  key: EmpresaReferralCardKey;
  label: string;
  description: string;
  statuses: ReferralStatus[];
};

const EMPRESA_REFERRAL_PIPELINE_STATUSES: ReferralStatus[] = [
  "NOVO",
  "EM_ANALISE",
  "AGUARDANDO_AGENDAMENTO",
  "AGENDADO",
  "EM_ATENDIMENTO",
  "AGUARDANDO_RESULTADO",
];

/** Cards de status na tela Exames — visão do RH */
export const EMPRESA_REFERRAL_STAT_CARDS: EmpresaReferralCard[] = [
  {
    key: "AGENDADOS",
    label: "Agendados",
    description: "Colaboradores encaminhados à clínica",
    statuses: EMPRESA_REFERRAL_PIPELINE_STATUSES,
  },
  {
    key: "AGUARDANDO_DOCUMENTO",
    label: "Aguardando documento",
    description: "Exame realizado, aguardando anexo",
    statuses: ["AGUARDANDO_DOCUMENTO"],
  },
  {
    key: "ASO_DISPONIVEL",
    label: "ASO disponível",
    description: "Pronto para baixar",
    statuses: ["ASO_DISPONIVEL", "CONCLUIDO"],
  },
  {
    key: "ASO_PENDENTE",
    label: "ASO pendente",
    description: "Encaminhados sem ASO liberado",
    statuses: [...EMPRESA_REFERRAL_PIPELINE_STATUSES, "AGUARDANDO_DOCUMENTO"],
  },
];

export function empresaReferralCardByKey(key?: string): EmpresaReferralCard | undefined {
  return EMPRESA_REFERRAL_STAT_CARDS.find((card) => card.key === key);
}

export function empresaReferralCardLabel(key: string): string {
  return empresaReferralCardByKey(key)?.label ?? key;
}

const EMPRESA_PRE_SCHEDULE_STATUSES: ReferralStatus[] = [
  "NOVO",
  "EM_ANALISE",
  "AGUARDANDO_AGENDAMENTO",
  "AGENDADO",
];

const EMPRESA_IN_ATTENDANCE_STATUSES: ReferralStatus[] = [
  "EM_ATENDIMENTO",
  "AGUARDANDO_RESULTADO",
  "AGUARDANDO_DOCUMENTO",
];

const EMPRESA_FINISHED_STATUSES: ReferralStatus[] = ["CONCLUIDO", "ASO_DISPONIVEL"];

export function applyEmpresaReferralStatusFilter(
  where: import("@prisma/client").Prisma.ReferralWhereInput,
  statusFilter?: string
): import("@prisma/client").Prisma.ReferralWhereInput {
  if (!statusFilter) return where;

  switch (statusFilter) {
    case "AGUARDANDO_AGENDAMENTO":
      return {
        ...where,
        scheduledAt: null,
        status: { in: EMPRESA_PRE_SCHEDULE_STATUSES },
      };
    case "AGENDADO":
      return {
        ...where,
        scheduledAt: { not: null },
        status: { in: EMPRESA_PRE_SCHEDULE_STATUSES },
      };
    case "EM_ATENDIMENTO":
      return {
        ...where,
        status: { in: EMPRESA_IN_ATTENDANCE_STATUSES },
      };
    case "CONCLUIDO":
      return {
        ...where,
        status: { in: EMPRESA_FINISHED_STATUSES },
      };
    case "CANCELADO":
      return {
        ...where,
        status: "CANCELADO",
      };
    default: {
      const card = empresaReferralCardByKey(statusFilter);
      if (!card) return where;
      return { ...where, status: { in: card.statuses } };
    }
  }
}

/**
 * Status exibido para o RH — nunca mostra "Agendado" sem data/horário reais.
 */
export function empresaReferralDisplayStatus(
  status: ReferralStatus,
  scheduledAt?: string | Date | null
): { label: string; toneStatus: string } {
  if (status === "CANCELADO") {
    return { label: "Cancelado", toneStatus: "CANCELADO" };
  }
  if (EMPRESA_FINISHED_STATUSES.includes(status)) {
    return { label: "Concluído", toneStatus: "CONCLUIDO" };
  }
  if (EMPRESA_IN_ATTENDANCE_STATUSES.includes(status)) {
    return { label: "Em atendimento", toneStatus: "EM_ATENDIMENTO" };
  }
  if (scheduledAt) {
    return { label: "Agendado", toneStatus: "AGENDADO" };
  }
  return { label: "Aguardando agendamento", toneStatus: "AGUARDANDO_AGENDAMENTO" };
}

export function empresaReferralStatusLabel(
  status: ReferralStatus,
  scheduledAt?: string | Date | null
): string {
  return empresaReferralDisplayStatus(status, scheduledAt).label;
}

/** Orientação objetiva para o RH conforme o status do encaminhamento */
export function empresaReferralStatusGuidance(
  status: ReferralStatus,
  scheduledAt: string | null
): string {
  const { label } = empresaReferralDisplayStatus(status, scheduledAt);
  if (label === "Cancelado") {
    return "Esta solicitação foi cancelada. Abra uma nova solicitação se necessário.";
  }
  if (label === "Concluído") {
    return "O exame foi finalizado. Confira os documentos na aba Documentos.";
  }
  if (label === "Em atendimento") {
    return "O colaborador já compareceu. Acompanhe até a liberação do documento.";
  }
  if (label === "Agendado") {
    return "Exame agendado. Oriente o colaborador a comparecer na data e horário indicados com documento de identidade.";
  }
  return "Solicitação registrada. Aguarde a clínica definir data e horário do exame.";
}

export const EMPRESA_EXAMES_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Status" },
  { value: "AGUARDANDO_AGENDAMENTO", label: "Aguardando agendamento" },
  { value: "AGENDADO", label: "Agendado" },
  { value: "EM_ATENDIMENTO", label: "Em atendimento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export const EMPRESA_NAV_SECTIONS = [
  { label: "Geral", hrefs: ["/dashboard"] },
  {
    label: "Operação",
    hrefs: [
      "/dashboard/colaboradores",
      "/dashboard/encaminhamentos",
      "/dashboard/documentos",
      "/dashboard/exames",
    ],
  },
  { label: "Suporte", hrefs: ["/dashboard/chamados"] },
] as const;

/** Whitelist de rotas visíveis no menu do RH */
export const EMPRESA_NAV_HREFS: readonly string[] = EMPRESA_NAV_SECTIONS.flatMap(
  (section) => section.hrefs
);

export function collaboratorStatCardsForEmpresa() {
  return COLLABORATOR_STAT_CARDS.filter((c) => c.key !== "sem_empresa");
}

export function appointmentStatCardsForEmpresa() {
  return APPOINTMENT_STAT_CARDS.filter((c) => c.key !== "em_atendimento");
}

export function referralStatCardsForEmpresa() {
  return EMPRESA_REFERRAL_STAT_CARDS;
}

/** Cards da tela Documentos — portal RH (foco em download) */
export const EMPRESA_DOCUMENT_STAT_CARDS = [
  { key: "para_baixar", filter: "PARA_BAIXAR", label: "Disponíveis para baixar" },
  { key: "aguardando", filter: "AGUARDANDO_ARQUIVO", label: "Aguardando liberação" },
  { key: "mes", filter: "MES_ARQUIVO", label: "Novos neste mês" },
] as const;

export function documentStatCardsForEmpresa() {
  return EMPRESA_DOCUMENT_STAT_CARDS.map((c) => ({ ...c }));
}

/** Documentos da empresa com arquivo anexado pela clínica */
export function empresaDocumentDownloadableWhere(
  companyId: string
): { companyId: string; fileUrl: { not: null }; status: { notIn: ["ARQUIVADO", "CANCELADO"] } } {
  return {
    companyId,
    fileUrl: { not: null },
    status: { notIn: ["ARQUIVADO", "CANCELADO"] },
  };
}

export function applyEmpresaDocumentCardFilter(
  where: import("@prisma/client").Prisma.DocumentWhereInput,
  card?: string
): import("@prisma/client").Prisma.DocumentWhereInput {
  if (!card || card === "ALL") return where;

  if (card === "PARA_BAIXAR") {
    return { ...where, fileUrl: { not: null }, status: { notIn: ["ARQUIVADO", "CANCELADO"] } };
  }
  if (card === "ASO_ARQUIVO") {
    return {
      ...where,
      type: "ASO",
      fileUrl: { not: null },
      status: { notIn: ["ARQUIVADO", "CANCELADO"] },
    };
  }
  if (card === "AGUARDANDO_ARQUIVO") {
    return {
      ...where,
      fileUrl: null,
      status: {
        notIn: ["ARQUIVADO", "CANCELADO", "DISPONIVEL", "CONCLUIDO", "EM_DIA", "ENVIADO", "ENTREGUE"],
      },
    };
  }
  if (card === "MES_ARQUIVO") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return {
      ...where,
      fileUrl: { not: null },
      createdAt: { gte: monthStart, lte: monthEnd },
    };
  }
  return where;
}

/** Filtro de status simplificado para o portal RH */
export function applyEmpresaDocumentStatusFilter(
  where: import("@prisma/client").Prisma.DocumentWhereInput,
  status?: string
): import("@prisma/client").Prisma.DocumentWhereInput {
  if (!status || status === "ALL") return where;

  if (status === "aguardando") {
    return {
      ...where,
      fileUrl: null,
      status: {
        notIn: ["ARQUIVADO", "CANCELADO", "DISPONIVEL", "CONCLUIDO", "EM_DIA", "ENVIADO", "ENTREGUE"],
      },
    };
  }
  if (status === "disponivel") {
    return {
      ...where,
      fileUrl: { not: null },
      status: { notIn: ["ARQUIVADO", "CANCELADO", "VENCIDO"] },
    };
  }
  if (status === "vencido") {
    return {
      ...where,
      OR: [{ status: "VENCIDO" }, { validUntil: { lt: new Date() } }],
    };
  }
  return where;
}

export const EMPRESA_DOCUMENT_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Status" },
  { value: "aguardando", label: "Aguardando liberação" },
  { value: "disponivel", label: "Disponível" },
  { value: "vencido", label: "Vencido" },
] as const;

export function empresaDocumentDisplayStatus(doc: {
  hasFile: boolean;
  status: string;
  validUntil?: string | null;
  validityLabel?: string | null;
}): { label: string; toneStatus: string } {
  if (doc.status === "VENCIDO" || doc.validityLabel === "Vencido") {
    return { label: "Vencido", toneStatus: "VENCIDO" };
  }
  if (doc.validUntil && new Date(doc.validUntil) < new Date() && doc.hasFile) {
    return { label: "Vencido", toneStatus: "VENCIDO" };
  }
  if (doc.hasFile) {
    return { label: "Disponível", toneStatus: "DISPONIVEL" };
  }
  return { label: "Aguardando liberação", toneStatus: "PENDENTE" };
}

export function ticketStatCardsForEmpresa() {
  return TICKET_STAT_CARDS.filter(
    (c) => !["fechados", "aguardando", "alta_prioridade"].includes(c.key)
  );
}

/** Cabeçalho do CSV de importação em massa de colaboradores */
export const COLLABORATOR_IMPORT_CSV_HEADER =
  "nome_completo;cpf;data_nascimento;sexo;telefone;funcao;setor;rg";

export const COLLABORATOR_IMPORT_CSV_SAMPLE = `${COLLABORATOR_IMPORT_CSV_HEADER}
Carlos Eduardo Santos;52998224725;1985-03-15;M;(99) 99000-1001;Operador de máquinas;Produção;123456789
Fernanda Lima Oliveira;39053344705;1990-07-22;F;(99) 99000-2002;Auxiliar administrativo;Administrativo;`;
